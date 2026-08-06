import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import chestGlowUrl from '../../assets/textures/chest-p.png';
import {
  ABDOMEN_GLOW_PEAK_OPACITY,
  ABDOMEN_GLOW_PEAK_SCALE,
  ABDOMEN_LOCAL,
  ATMOSPHERE_PEAK_OPACITY,
  ATMOSPHERE_SCALE_BASE,
  CHEST_GLOW_POSITION,
  CHEST_GLOW_SCALE,
  MODEL_URL,
  NOSE_CORRECTION,
  UP,
  WING_FLAP_AMPLITUDE,
  WING_FLAP_AXIS,
  WING_FLAP_SIGN,
  WING_FLAP_SPEED,
  WING_ROOT_LOCAL,
  WING_TWIST_AMPLITUDE,
  WING_TWIST_AXIS,
  getGlowTexture,
  rigWingHinge,
  tunePiriMaterials,
} from './PiriModel';
import { easeOutCubic } from '../../lib/introTimeline';
import {
  FLYBY_DURATION,
  FLYBY_EDGE_MARGIN,
  getFlybyIntensity,
  getFlybyProgress,
  getFlybySpeedFactor,
} from '../../lib/flybyTimeline';
import { getFlybyTargetWidthPx } from '../../lib/flybySize';
import { flybyState } from '../../lib/flybyState';

// A short, self-contained cinematic "moment" — reuses the exact same GLTF
// (via drei's URL-keyed cache, see MODEL_URL), the exact same glow sprite
// texture (getGlowTexture), the exact same chest-glow overlay and abdomen
// glow constants, and the exact same validated wing-hinge rig as the hero's
// PiriModel — plus `<Environment preset="city">`, matching Hero.tsx exactly.
// That environment map (image-based lighting for the metallic body
// material's reflections) was the single biggest reason this scene used to
// read noticeably darker/flatter than the hero: two flat lights alone can't
// reproduce the reflective, "premium" look PBR metalness relies on IBL for.
//
// `scene.clone(true)` gives this its own independent Object3D hierarchy (so
// it can't fight the hero's own instance over `.parent`) while sharing
// geometry by reference. Materials are then explicitly cloned per-mesh so
// this scene can freely tune/animate its own opacity and emissive intensity
// without touching the hero's (or the About scene's) still-mounted copies —
// `tunePiriMaterials` mutates properties in place, so skipping the clone
// step here would leak straight into the hero.

// Rest pose faces +Z (see PiriModel.tsx); rotating +90 deg around Y points
// the nose along +X, i.e. the direction of travel (left -> right). After
// this rotation the model's local Z extent (nose-to-tail length) is what
// reads as "width" on screen — see the natural-size measurement below.
const FLY_ORIENTATION = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
// The local "forward" axis after FLY_ORIENTATION/NOSE_CORRECTION — banking
// (see below) rotates around this, in the model's own local frame.
const FORWARD_LOCAL = new THREE.Vector3(0, 0, 1);

const MAX_BANK_RAD = 0.34;
const BANK_GAIN = 0.9;
const MAX_PITCH_TRIM_RAD = 0.16;

// Wing flap intensity is derived from the actual flight speed (see
// getFlybySpeedFactor) rather than a separate invented curve — "stronger
// wing movement during acceleration, stable during cruise, reduced during
// deceleration" falls out of the same motion profile driving position.
const WING_INTENSITY_FLOOR = 0.55;
// Small phase offset between wings so the flap isn't a perfectly mirrored
// loop — "small asymmetry or phase variation to avoid robotic perfect
// mirroring."
const WING_PHASE_OFFSET = 0.09;

// ---- Trail tuning -----------------------------------------------------
// Short and quickly dissolving by design — a small pool with a fast fade
// keeps the trail's physical on-screen LENGTH short (length ~= speed x
// fade duration) regardless of how fast Piri happens to be moving, instead
// of a dense/long-lived pool that reads as one continuous glowing band.
//
// Pool size, fade duration, and per-sprite scale were previously large
// enough (12 sprites x ~0.2s fade, each close to Piri's own on-screen size)
// that several were alive and overlapping via additive blending at once —
// which is exactly what read as a solid illuminated tube behind Piri
// instead of a wake. Trimmed pool/fade/scale here so at most a handful of
// small, quickly-shrinking sprites are ever alive together.
const TRAIL_POOL_SIZE = 7;
const TRAIL_EMIT_INTERVAL = 0.03;
const TRAIL_FADE_DURATION = 0.13;
const TRAIL_RISE_FRAC = 0.12;

const SPARK_POOL_SIZE = 5;
const SPARK_EMIT_CHANCE = 0.3;
const SPARK_FADE_DURATION = 0.22;

// A large negative default so, on the very first painted frame (before
// useFrame has run even once), Piri can never appear anywhere near the
// visible corridor — belt-and-suspenders against a one-frame flash at the
// scene's default (0,0,0) origin. useFrame overwrites this immediately.
const OFFSCREEN_START: [number, number, number] = [-100000, 0, 0];

export interface PiriFlybySceneProps {
  onComplete: () => void;
}

export default function PiriFlybyScene({ onComplete }: PiriFlybySceneProps) {
  const { scene } = useGLTF(MODEL_URL);
  const chestTexture = useTexture(chestGlowUrl);
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const { viewport, camera, gl, size } = useThree();

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : (mesh.material as THREE.Material).clone();
      }
    });
    tunePiriMaterials(clone);
    return clone;
  }, [scene]);

  // Measured once from the actual geometry (not guessed from the texture,
  // which may include transparent padding) — the model's own bounding box
  // at scale 1, pre-rotation. After FLY_ORIENTATION (+90deg around Y), the
  // model's local Z extent (nose-to-tail) becomes the on-screen horizontal
  // extent, and local Y (unaffected by a Y-axis rotation) stays the
  // on-screen vertical extent.
  const naturalSize = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const boxSize = box.getSize(new THREE.Vector3());
    return { screenWidth: Math.max(0.001, boxSize.z), screenHeight: Math.max(0.001, boxSize.y) };
  }, [clonedScene]);

  const wingLeft = useRef<THREE.Object3D | null>(null);
  const wingRight = useRef<THREE.Object3D | null>(null);
  const restLeft = useRef(new THREE.Quaternion());
  const restRight = useRef(new THREE.Quaternion());

  useEffect(() => {
    // Same validated hinge rig as PiriModel.tsx/PiriAboutScene.tsx — not a
    // simplified/incompatible substitute. Reparents each wing under a pivot
    // Group at its anatomical root so the flap hinges from the correct
    // point instead of the mesh's raw geometric center (which reads as
    // "clipping through the body" once Piri is rendered large enough to
    // actually see the joint).
    const rawLeft = clonedScene.getObjectByName('Wing_Left') ?? null;
    const rawRight = clonedScene.getObjectByName('Wing_Right') ?? null;
    wingLeft.current = rigWingHinge(rawLeft, WING_ROOT_LOCAL.Wing_Left);
    wingRight.current = rigWingHinge(rawRight, WING_ROOT_LOCAL.Wing_Right);
    if (wingLeft.current) restLeft.current.copy(wingLeft.current.quaternion);
    if (wingRight.current) restRight.current.copy(wingRight.current.quaternion);
  }, [clonedScene]);

  const flightGroup = useRef<THREE.Group>(null);
  const modelGroup = useRef<THREE.Group>(null);
  const abdomenAnchor = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const completedRef = useRef(false);

  const abdomenGlow = useRef<THREE.Sprite>(null);
  const atmosphereGlow = useRef<THREE.Sprite>(null);
  const coreHalo = useRef<THREE.Sprite>(null);

  const trailSprites = useRef<THREE.Sprite[]>([]);
  const trailAges = useRef<number[]>(new Array(TRAIL_POOL_SIZE).fill(Infinity));
  const trailNextIndex = useRef(0);
  const trailEmitTimer = useRef(0);

  const sparkSprites = useRef<THREE.Sprite[]>([]);
  const sparkAges = useRef<number[]>(new Array(SPARK_POOL_SIZE).fill(Infinity));
  const sparkVelocity = useRef<THREE.Vector3[]>(Array.from({ length: SPARK_POOL_SIZE }, () => new THREE.Vector3()));
  const sparkNextIndex = useRef(0);

  const abdomenWorldPos = useMemo(() => new THREE.Vector3(), []);
  const projectionScratch = useMemo(() => new THREE.Vector3(), []);
  const bankQuat = useMemo(() => new THREE.Quaternion(), []);
  const orientationQuat = useMemo(() => new THREE.Quaternion(), []);
  const lookMatrix = useMemo(() => new THREE.Matrix4(), []);
  const p0 = useMemo(() => new THREE.Vector3(), []);
  const p1 = useMemo(() => new THREE.Vector3(), []);

  // The canvas's own on-screen rect, needed to translate Piri's projected
  // position into WINDOW-relative fractions (flybyState.xFrac/yFrac) that
  // NightSky — a separate, full-viewport, fixed canvas — can compare
  // directly against its own stars' screen coordinates. Read once: this
  // canvas's box doesn't move during the pass.
  const canvasRect = useRef<DOMRect | null>(null);
  useEffect(() => {
    canvasRect.current = gl.domElement.getBoundingClientRect();
  }, [gl]);

  // Vertical position as an explicit function of elapsed time (not just
  // sampled per-frame) so its analytic derivative — the actual vertical
  // VELOCITY, not a guess — can drive both the lookAt tangent (already
  // implicit, since the tangent sample below uses this same function) and
  // an explicit bank angle.
  const verticalY = (e: number, h: number) => Math.sin(e * 3.1) * h * 0.045 + Math.sin(e * 1.3 + 1.7) * h * 0.02;
  const verticalVelocity = (e: number, h: number) =>
    Math.cos(e * 3.1) * 3.1 * h * 0.045 + Math.cos(e * 1.3 + 1.7) * 1.3 * h * 0.02;

  useFrame((_, rawDelta) => {
    if (!flightGroup.current || !modelGroup.current) return;
    // Clamped so a tab-visibility pause mid-flight (frameloop toggled back
    // on in PiriFlybyMoment.tsx) can't jump `elapsed` straight past
    // FLYBY_DURATION in one step — same defensive clamp the About scene
    // already uses.
    const delta = Math.min(0.1, rawDelta);
    elapsed.current += delta;
    const e = elapsed.current;

    if (e >= FLYBY_DURATION) {
      if (!completedRef.current) {
        completedRef.current = true;
        flybyState.active = false;
        flybyState.intensity = 0;
        onComplete();
      }
      return;
    }

    // Responsive target width, recomputed live from the canvas's own
    // current CSS size (r3f's `size.width` updates on resize/orientation
    // change automatically) — no separate resize listener needed, and this
    // never goes stale.
    //
    // `viewport.width` (r3f, THREE world units) and `size.width` (CSS px)
    // both describe the same physical span — the canvas's own visible
    // width at the z=0 plane — so their ratio is the world-units-per-pixel
    // conversion factor.
    const worldUnitsPerPixel = viewport.width / size.width;
    const targetWidthPx = getFlybyTargetWidthPx(size.width);
    const modelScale = (targetWidthPx * worldUnitsPerPixel) / naturalSize.screenWidth;
    modelGroup.current.scale.setScalar(modelScale);
    // World units, not px — same space as viewport.width below.
    const renderedWidthWorld = naturalSize.screenWidth * modelScale;

    // Fully off-screen at both ends, with extra clearance for the model's
    // OWN rendered width so a larger Piri never clips into view a frame
    // early/late — not just a fixed multiple of the viewport half-width.
    const halfW = (viewport.width / 2) * FLYBY_EDGE_MARGIN + renderedWidthWorld;
    const progress = getFlybyProgress(e);
    const speedFactor = getFlybySpeedFactor(e);
    const intensity = getFlybyIntensity(e);
    const x = THREE.MathUtils.lerp(-halfW, halfW, progress);
    const y = verticalY(e, viewport.height);

    flightGroup.current.position.set(x, y, 0);

    // Orientation: sample the curve's own tangent a hair ahead (same
    // technique as the hero/about scenes) so pitch is DERIVED from the
    // actual trajectory, not a separately invented wobble — then layer an
    // explicit bank (roll around the direction of travel) proportional to
    // vertical velocity, i.e. "leaning into" a climb or dive, clamped to a
    // restrained maximum so it never reads as flying sideways.
    const eps = 0.01;
    const xNext = THREE.MathUtils.lerp(-halfW, halfW, getFlybyProgress(e + eps));
    const yNext = verticalY(e + eps, viewport.height);
    p0.set(x, y, 0);
    p1.set(xNext, yNext, 0);
    if (p1.distanceToSquared(p0) > 1e-8) {
      lookMatrix.lookAt(p0, p1, UP);
      orientationQuat.setFromRotationMatrix(lookMatrix).multiply(NOSE_CORRECTION);
    } else {
      orientationQuat.copy(FLY_ORIENTATION);
    }

    const vVel = verticalVelocity(e, viewport.height);
    const bankAngle = THREE.MathUtils.clamp(-vVel * BANK_GAIN * 0.01, -MAX_BANK_RAD, MAX_BANK_RAD);
    bankQuat.setFromAxisAngle(FORWARD_LOCAL, bankAngle);
    orientationQuat.multiply(bankQuat);

    // A small, speed-linked pitch trim on top — nose trims slightly up
    // during the accel/decel edges (lower speedFactor) and levels out at
    // cruise, a subtle "settling into level flight" cue.
    const pitchTrim = (1 - speedFactor) * MAX_PITCH_TRIM_RAD * 0.4;
    orientationQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchTrim));

    flightGroup.current.quaternion.copy(orientationQuat);

    // Wings: intensity derived from the same speed factor driving position
    // — full energy through the fast cruise, easing down (never below
    // WING_INTENSITY_FLOOR) during the slower accel/decel edges. Each wing
    // gets a slightly different phase (WING_PHASE_OFFSET) so the flap isn't
    // a perfectly mirrored loop.
    const wingIntensity = WING_INTENSITY_FLOOR + (1 - WING_INTENSITY_FLOOR) * speedFactor;
    const flapPhaseLeft = e * WING_FLAP_SPEED;
    const flapPhaseRight = flapPhaseLeft + WING_PHASE_OFFSET;
    applyWingFlap(wingLeft.current, restLeft.current, flapPhaseLeft, wingIntensity, WING_FLAP_SIGN.Wing_Left);
    applyWingFlap(wingRight.current, restRight.current, flapPhaseRight, wingIntensity, WING_FLAP_SIGN.Wing_Right);

    flightGroup.current.updateMatrixWorld(true);
    if (abdomenAnchor.current) {
      abdomenAnchor.current.getWorldPosition(abdomenWorldPos);
    }

    // ---- Abdomen glow: steady peak look (no charge/breath timeline here,
    // just the hero's own peak values) so the "bright glowing blue abdomen"
    // reads consistently throughout the pass. ----
    if (abdomenGlow.current) {
      const mat = abdomenGlow.current.material as THREE.SpriteMaterial;
      mat.opacity = ABDOMEN_GLOW_PEAK_OPACITY * intensity;
      abdomenGlow.current.scale.setScalar(ABDOMEN_GLOW_PEAK_SCALE);
    }
    if (atmosphereGlow.current) {
      const mat = atmosphereGlow.current.material as THREE.SpriteMaterial;
      mat.opacity = ATMOSPHERE_PEAK_OPACITY * intensity;
      atmosphereGlow.current.scale.setScalar(ATMOSPHERE_SCALE_BASE);
    }

    // ---- Trail: a tight, tapered dissolve connected to the abdomen glow
    // above (not a separate, larger "halo" reading as a detached blob). ----
    const jitter = 1 + Math.sin(e * 47) * 0.05 + Math.sin(e * 83 + 1.1) * 0.04;
    // Was modelScale * 2.6 (i.e. noticeably WIDER than Piri's own body) —
    // now capped below the model's own size so the halo reads as glow
    // clinging to the tail, never a separate object bigger than Piri.
    const tailScale = modelScale * 1.5;
    if (coreHalo.current) {
      coreHalo.current.position.copy(abdomenWorldPos);
      coreHalo.current.scale.setScalar(tailScale * (0.7 + intensity * 0.3) * jitter);
      const mat = coreHalo.current.material as THREE.SpriteMaterial;
      mat.opacity = intensity * 0.22;
    }

    trailEmitTimer.current += delta;
    if (intensity > 0.02 && trailEmitTimer.current >= TRAIL_EMIT_INTERVAL) {
      trailEmitTimer.current = 0;
      const idx = trailNextIndex.current % TRAIL_POOL_SIZE;
      trailNextIndex.current += 1;
      const sprite = trailSprites.current[idx];
      if (sprite) {
        sprite.position.copy(abdomenWorldPos);
        sprite.visible = true;
        trailAges.current[idx] = 0;
      }

      // Sparks "peeling away" — spawned alongside the main trail, each with
      // its own small random drift instead of following the ribbon.
      if (Math.random() < SPARK_EMIT_CHANCE) {
        const sIdx = sparkNextIndex.current % SPARK_POOL_SIZE;
        sparkNextIndex.current += 1;
        const spark = sparkSprites.current[sIdx];
        if (spark) {
          spark.position.copy(abdomenWorldPos);
          spark.visible = true;
          sparkAges.current[sIdx] = 0;
          sparkVelocity.current[sIdx].set(
            -viewport.width * (0.1 + Math.random() * 0.12),
            (Math.random() - 0.5) * viewport.height * 0.35,
            0,
          );
        }
      }
    }

    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      const sprite = trailSprites.current[i];
      if (!sprite || !sprite.visible) continue;
      trailAges.current[i] += delta;
      const age = trailAges.current[i];
      if (age >= TRAIL_FADE_DURATION) {
        sprite.visible = false;
        continue;
      }
      const p = age / TRAIL_FADE_DURATION;
      // Front-loaded: the newest points (closest to Piri's current
      // position) are brightest, fading rapidly — with a short fade
      // duration this stays a tight taper right behind the tail instead of
      // a long band.
      const fade = p < TRAIL_RISE_FRAC ? easeOutCubic(p / TRAIL_RISE_FRAC) : 1 - easeOutCubic((p - TRAIL_RISE_FRAC) / (1 - TRAIL_RISE_FRAC));
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.opacity = fade * 0.5 * intensity;
      // Tapers narrower the older/farther-back it is (fade -> 0), never
      // growing past a fraction of the model's own tailScale — this is
      // what keeps the wake reading as "narrower farther from Piri" rather
      // than a uniform-width band.
      sprite.scale.setScalar(tailScale * (0.25 + fade * 0.3));
    }

    for (let i = 0; i < SPARK_POOL_SIZE; i++) {
      const spark = sparkSprites.current[i];
      if (!spark || !spark.visible) continue;
      sparkAges.current[i] += delta;
      const age = sparkAges.current[i];
      if (age >= SPARK_FADE_DURATION) {
        spark.visible = false;
        continue;
      }
      spark.position.addScaledVector(sparkVelocity.current[i], delta);
      const p = age / SPARK_FADE_DURATION;
      const fade = 1 - easeOutCubic(p);
      const mat = spark.material as THREE.SpriteMaterial;
      mat.opacity = fade * 0.6 * intensity;
      spark.scale.setScalar(tailScale * (0.12 + fade * 0.1));
    }

    // ---- Star reaction (NightSky reads this) ----
    if (canvasRect.current) {
      projectionScratch.copy(abdomenWorldPos).project(camera);
      const localXFrac = projectionScratch.x * 0.5 + 0.5;
      const localYFrac = 1 - (projectionScratch.y * 0.5 + 0.5);
      const rect = canvasRect.current;
      flybyState.xFrac = (rect.left + localXFrac * rect.width) / window.innerWidth;
      flybyState.yFrac = (rect.top + localYFrac * rect.height) / window.innerHeight;
    }
    flybyState.active = true;
    flybyState.intensity = intensity;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} />
      <Environment preset="city" />
      <group ref={flightGroup} position={OFFSCREEN_START}>
        {/* Same nesting as PiriModel.tsx: the chest-glow plane and abdomen
            anchor both sit INSIDE the scaled group, in the same pre-scale
            local space their constants were measured in. Scale itself is
            applied imperatively (modelGroup.current.scale) every frame from
            the live, resize-aware target width computed above. */}
        <group ref={modelGroup}>
          <primitive object={clonedScene} />
          <mesh position={CHEST_GLOW_POSITION} scale={CHEST_GLOW_SCALE}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={chestTexture} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <group ref={abdomenAnchor} position={ABDOMEN_LOCAL}>
            <sprite ref={atmosphereGlow}>
              <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite ref={abdomenGlow}>
              <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite ref={coreHalo}>
              <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        </group>
      </group>
      <group>
        {Array.from({ length: TRAIL_POOL_SIZE }, (_, i) => (
          <sprite
            key={`trail-${i}`}
            visible={false}
            ref={(s) => {
              if (s) trailSprites.current[i] = s;
            }}
          >
            <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
        {Array.from({ length: SPARK_POOL_SIZE }, (_, i) => (
          <sprite
            key={`spark-${i}`}
            visible={false}
            ref={(s) => {
              if (s) sparkSprites.current[i] = s;
            }}
          >
            <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>
    </>
  );
}

const flapQuat = new THREE.Quaternion();
const twistQuat = new THREE.Quaternion();
const wingDelta = new THREE.Quaternion();

function applyWingFlap(wing: THREE.Object3D | null, rest: THREE.Quaternion, flapPhase: number, intensity: number, sign: number) {
  if (!wing) return;
  const flapAngle = Math.sin(flapPhase) * WING_FLAP_AMPLITUDE * intensity * sign;
  const twistAngle = Math.cos(flapPhase) * WING_TWIST_AMPLITUDE * intensity * sign;
  flapQuat.setFromAxisAngle(WING_FLAP_AXIS, flapAngle);
  twistQuat.setFromAxisAngle(WING_TWIST_AXIS, twistAngle);
  wingDelta.copy(flapQuat).multiply(twistQuat);
  wing.quaternion.copy(rest).multiply(wingDelta);
}
