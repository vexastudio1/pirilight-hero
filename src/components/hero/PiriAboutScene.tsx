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
  REST_QUATERNION,
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

// The "Sobre a PiriLight" moment — reuses the exact same GLTF (drei's
// URL-keyed cache, see MODEL_URL) as the hero and the Mission -> Services
// flyby, plus the exact same chest-glow overlay, abdomen glow constants,
// and `<Environment preset="city">` image-based lighting the hero uses —
// without that environment map the metallic body material has nothing to
// reflect and reads flat/dark regardless of how strong the direct lights
// are, which was the main reason this scene looked noticeably darker than
// the hero. `scene.clone(true)` gives it an independent Object3D hierarchy
// (so it can't fight either other instance over `.parent`) while sharing
// geometry by reference; materials are cloned per-mesh so this scene can
// freely animate its own opacity without touching the hero's or the
// flyby's still-mounted copies. The wing rig (rigWingHinge) and the
// front-facing rest pose (REST_QUATERNION) are the exact same ones
// PiriModel.tsx already validated — not re-derived.
//
// Unlike the flyby (one-shot, unmounts when done), this scene never
// "finishes" — it has no entrance phase at all, only the indefinite hover.
// The wrapper (PiriAboutMoment.tsx) is what pauses/resumes rendering via
// the Canvas's own `frameloop` prop when the section leaves the viewport or
// the tab is backgrounded — this component doesn't need to know about
// that; it just keeps advancing `elapsed` on whatever frames actually fire.
//
// There used to be a right-to-left flight-in (a CatmullRomCurve3 through
// FLIGHT_POINTS_FRAC, tangent-following orientation, an opacity ramp) that
// played once before settling into this same hover. Removed outright, not
// just visually hidden: the user should never see Piri fly in from off-
// circle — by the time this section is visible, Piri must already be in
// exactly the pose the old entrance used to end on. `REST_Z` is that same
// final resting depth the old flight path's last waypoint used to land on
// (`[0, 0, 0.3]`), kept as the one number worth preserving so the hover
// itself is pixel-identical to before, not re-tuned.
const REST_Z = 0.3;
const REDUCED_MOTION_START: [number, number, number] = [0, 0, REST_Z];

// Calm-but-visible hover flap — reuses the hero's own flap formula/axes
// (imported above) at a lower, steadier intensity than full-power flight,
// per "continuous wing flapping... clearly communicate flight, but not so
// fast it becomes distracting."
const HOVER_WING_INTENSITY = 0.45;
// Small phase offset between wings while hovering so the flap isn't a
// perfectly mirrored loop — "a slight difference between the left and
// right wing phases."
const WING_PHASE_OFFSET = 0.07;

// Target: 60-75% of the circle's usable diameter — 68% picked as the
// midpoint, measured against the model's OWN largest bounding-box axis (not
// just wingspan) so nothing crops regardless of orientation during flight.
const TARGET_DIAMETER_FRACTION = 0.68;

export interface PiriAboutSceneProps {
  reducedMotion: boolean;
}

export default function PiriAboutScene({ reducedMotion }: PiriAboutSceneProps) {
  const { scene } = useGLTF(MODEL_URL);
  const chestTexture = useTexture(chestGlowUrl);
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const { viewport, size } = useThree();

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => m.clone())
          : (mesh.material as THREE.Material).clone();
      }
    });
    tunePiriMaterials(clone);
    return clone;
  }, [scene]);

  // Measured once from the actual geometry (not guessed from the texture,
  // which may include transparent padding). The largest of the three axes
  // is used as the sizing reference — safe regardless of the model's
  // current orientation (flight profile vs. front-facing rest), since even
  // the longest axis is guaranteed to fit inside the target diameter.
  const naturalDiameter = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const boxSize = box.getSize(new THREE.Vector3());
    return Math.max(0.001, boxSize.x, boxSize.y, boxSize.z);
  }, [clonedScene]);

  const wingLeft = useRef<THREE.Object3D | null>(null);
  const wingRight = useRef<THREE.Object3D | null>(null);
  const restLeft = useRef(new THREE.Quaternion());
  const restRight = useRef(new THREE.Quaternion());

  useEffect(() => {
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
  const abdomenGlow = useRef<THREE.Sprite>(null);
  const atmosphereGlow = useRef<THREE.Sprite>(null);
  const chestMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const abdomenWorldPos = useMemo(() => new THREE.Vector3(), []);
  const elapsed = useRef(0);
  // Tracks whether setOpacity(1) has already been asserted once — a full
  // scene-graph traversal, worth doing exactly once rather than on every
  // frame of the indefinite hover. There is no fade-in left to gate this
  // on: full opacity is asserted on the very first frame that runs, before
  // that frame is ever painted, so nothing is visibly transparent even
  // momentarily.
  const settledOpacityAppliedRef = useRef(false);

  const idleQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, rawDelta) => {
    if (!flightGroup.current || !modelGroup.current) return;
    // Clamped so a long pause (frameloop toggled back on after the section
    // was scrolled out of view / tab backgrounded for a while) can't cause
    // a single-frame jump in flap/idle phase.
    const delta = Math.min(0.1, rawDelta);
    elapsed.current += delta;
    const e = elapsed.current;

    const worldUnitsPerPixel = viewport.width / size.width;
    const targetWorldDiameter = (size.width * TARGET_DIAMETER_FRACTION) * worldUnitsPerPixel;
    const modelScale = targetWorldDiameter / naturalDiameter;
    modelGroup.current.scale.setScalar(modelScale);

    flightGroup.current.updateMatrixWorld(true);
    if (abdomenAnchor.current) abdomenAnchor.current.getWorldPosition(abdomenWorldPos);
    // Steady peak abdomen glow (no charge/breath timeline here — this
    // scene isn't the hero's charge storyboard, just a constantly "alive"
    // light) so the "bright glowing blue abdomen" / "chest light visible"
    // requirement reads consistently from the moment Piri is opaque.
    if (abdomenGlow.current) {
      (abdomenGlow.current.material as THREE.SpriteMaterial).opacity = ABDOMEN_GLOW_PEAK_OPACITY;
      abdomenGlow.current.scale.setScalar(ABDOMEN_GLOW_PEAK_SCALE);
    }
    if (atmosphereGlow.current) {
      (atmosphereGlow.current.material as THREE.SpriteMaterial).opacity = ATMOSPHERE_PEAK_OPACITY;
      atmosphereGlow.current.scale.setScalar(ATMOSPHERE_SCALE_BASE);
    }

    if (reducedMotion) {
      // Already in the final resting pose — front-facing, fully opaque,
      // idle motion suppressed per "keep either very slow wing movement or
      // a stable resting pose."
      flightGroup.current.position.set(...REDUCED_MOTION_START);
      flightGroup.current.quaternion.copy(REST_QUATERNION);
      if (!settledOpacityAppliedRef.current) {
        settledOpacityAppliedRef.current = true;
        setOpacity(clonedScene, 1);
        if (chestMaterial.current) chestMaterial.current.opacity = 1;
      }
      const flap = Math.sin(e * WING_FLAP_SPEED * 0.35) * WING_FLAP_AMPLITUDE * 0.18;
      if (wingLeft.current) wingLeft.current.rotation.z = flap;
      if (wingRight.current) wingRight.current.rotation.z = -flap;
      return;
    }

    // No entrance phase: this scene initializes directly in the same
    // settled hover an old right-to-left flight-in used to lead into —
    // fixed center position, small organic idle drift layered on top,
    // never enough to leave the circle. Same "layered incommensurate sine"
    // technique as the hero's own idle personality, tuned smaller since
    // this is a stationary portrait pose. A tiny forward/back (Z) breathing
    // motion is layered in too — "tiny forward-and-back movement" — on top
    // of the fixed resting Z (REST_Z, the old flight path's own final
    // depth, kept so the pose itself is unchanged from before).
    const floatY = Math.sin(e * 0.9 + 0.4) * 0.02 + Math.sin(e * 0.37 + 2.2) * 0.012;
    const swayX = Math.sin(e * 0.6 + 1.3) * 0.015 + Math.sin(e * 1.4 + 3.1) * 0.006;
    const driftZ = Math.sin(e * 0.44 + 0.8) * 0.025;
    const idleRoll = Math.sin(e * 0.5 + 1.8) * 0.03 + Math.sin(e * 0.21 + 4.4) * 0.014;
    const idlePitch = Math.sin(e * 0.33 + 0.9) * 0.018;

    flightGroup.current.position.set(swayX, floatY, REST_Z + driftZ);
    idleQuat.setFromEuler(new THREE.Euler(idlePitch, 0, idleRoll));
    flightGroup.current.quaternion.copy(REST_QUATERNION).multiply(idleQuat);

    if (!settledOpacityAppliedRef.current) {
      settledOpacityAppliedRef.current = true;
      setOpacity(clonedScene, 1);
      if (chestMaterial.current) chestMaterial.current.opacity = 1;
    }

    const flapPhaseLeft = e * WING_FLAP_SPEED;
    const flapPhaseRight = flapPhaseLeft + WING_PHASE_OFFSET;
    applyWingFlap(wingLeft.current, restLeft.current, flapPhaseLeft, HOVER_WING_INTENSITY, WING_FLAP_SIGN.Wing_Left);
    applyWingFlap(wingRight.current, restRight.current, flapPhaseRight, HOVER_WING_INTENSITY, WING_FLAP_SIGN.Wing_Right);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} />
      <Environment preset="city" />
      <group ref={flightGroup}>
        <group ref={modelGroup}>
          <primitive object={clonedScene} />
          <mesh position={CHEST_GLOW_POSITION} scale={CHEST_GLOW_SCALE}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial ref={chestMaterial} map={chestTexture} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <group ref={abdomenAnchor} position={ABDOMEN_LOCAL}>
            <sprite ref={atmosphereGlow}>
              <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite ref={abdomenGlow}>
              <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        </group>
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

function setOpacity(root: THREE.Object3D, opacity: number) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const m = mat as THREE.MeshStandardMaterial;
      if (opacity < 1) {
        m.transparent = true;
        m.opacity = opacity;
      } else if (m.opacity !== 1 || m.transparent) {
        m.opacity = 1;
        m.transparent = false;
      }
    }
  });
}

// No useGLTF.preload() here — PiriModel.tsx already preloads MODEL_URL on
// module load, and drei's cache is keyed by URL, so a second preload call
// would be redundant.
