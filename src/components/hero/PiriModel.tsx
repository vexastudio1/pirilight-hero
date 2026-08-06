import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import chestGlowUrl from '../../assets/textures/chest-p.png';
import { introState } from '../../lib/introState';
import {
  TIMELINE,
  easeOutCubic,
  getAbdomenBreath,
  getAbdomenCharge,
  getAtmosphereBreath,
  getEntranceProgress,
  getExitBodyOpacity,
  getExitProgress,
  getHoverArriveProgress,
  getHoverSettleBounce,
  getOrbitProgress,
  getTrailEmitStrength,
} from '../../lib/introTimeline';
import { getHoverTargetFrac, getModelScale } from '../../lib/logoLayout';

// Exported so PiriFlybyScene.tsx (the Mission -> Services flyby moment)
// loads the exact same GLTF via drei's URL-keyed cache — never a second
// fetch/parse — rather than re-declaring the path.
export const MODEL_URL = '/models/piri.optimized.glb';

// Wing-local axes (confirmed by inspecting the GLB: each wing mesh's local
// X is its span/long axis, local Z stays aligned with the body's front-back
// axis at rest). Flapping must hinge around Z, not spin around the span (X).
// Exported (alongside rigWingHinge/WING_ROOT_LOCAL/WING_FLAP_SIGN below) so
// PiriAboutScene.tsx's idle hover flap reuses the exact same rig/axes rather
// than re-deriving them — same wingbeat, same anatomy.
export const WING_FLAP_AXIS = new THREE.Vector3(0, 0, 1);
export const WING_TWIST_AXIS = new THREE.Vector3(1, 0, 0);
export const WING_FLAP_SPEED = 10;
export const WING_FLAP_AMPLITUDE = 0.62;
export const WING_TWIST_AMPLITUDE = 0.09;
// Adds a second harmonic to the flap's base sine so the down-stroke and
// up-stroke aren't mirror images of each other (real wingbeats aren't
// symmetric either) — same "no two motions share a shape" spirit as the
// eased flight curves below, applied to the wing itself. Kept modest so the
// beat still reads as the same flap, just less metronomic.
export const WING_ASYMMETRY = 0.15;
// A small squash on the wing's own chord (local Y) at the down-stroke peak,
// proportional to how strong that stroke currently is (so it fades out with
// wingIntensity exactly like the flap angle does) — a subtle stand-in for
// membrane compression, not a cartoon squash-and-stretch.
const WING_SQUASH_AMOUNT = 0.08;

// Wing-root pivot, in each wing mesh's own local (pre-scale) space — measured
// by sampling the mesh vertices closest to the body on each wing. Used to
// re-pivot the flap hinge from the wing's geometric center to its root.
export const WING_ROOT_LOCAL: Record<'Wing_Left' | 'Wing_Right', THREE.Vector3> = {
  Wing_Left: new THREE.Vector3(-0.9, -0.39, 0.35),
  Wing_Right: new THREE.Vector3(0.9, -0.33, 0.42),
};

// Wing_Left and Wing_Right are independently authored, not a true mirrored
// copy of one another: the root sits at local X ~ -0.9 for the left wing but
// ~ +0.9 for the right, so "root -> tip" points along +X for one wing and -X
// for the other. Rotating both by the same signed angle about local Z (the
// flap axis) therefore raises one wing while lowering the other. Flipping the
// sign per wing compensates so the visible flap is synchronized.
export const WING_FLAP_SIGN: Record<'Wing_Left' | 'Wing_Right', number> = {
  Wing_Left: 1,
  Wing_Right: -1,
};

// Reparents a wing mesh under a new pivot Group placed at its root (instead
// of its geometric center), preserving the wing's rest transform exactly so
// this is a no-op visually until the hinge is animated.
export function rigWingHinge(wing: THREE.Object3D | null, rootLocal: THREE.Vector3): THREE.Object3D | null {
  if (!wing || !wing.parent) return null;
  if (wing.userData.hinged) return wing.parent;

  const offset = rootLocal.clone().multiply(wing.scale);

  const hinge = new THREE.Group();
  hinge.name = `${wing.name}_Hinge`;
  hinge.position.copy(wing.position).add(offset.clone().applyQuaternion(wing.quaternion));
  hinge.quaternion.copy(wing.quaternion);

  wing.parent.add(hinge);
  wing.position.copy(offset).multiplyScalar(-1);
  wing.quaternion.identity();
  wing.userData.hinged = true;
  hinge.add(wing);

  return hinge;
}

// Local nose direction of the rest-pose mesh (confirmed by inspection: the
// body's front/head faces +Z). Object3D.lookAt() orients -Z at the target,
// so we flip 180deg to make +Z (the nose) point along the travel direction.
// Exported for reuse by PiriAboutScene.tsx's own tangent-following flight.
export const NOSE_CORRECTION = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
export const UP = new THREE.Vector3(0, 1, 0);

// The bioluminescent abdomen's local position (pre-scale, same space as the
// chest-glow plane's [0, 0.12, 0.8]) — measured directly from the body mesh
// (scripts/measure-abdomen.mjs): the rearmost vertices (most negative Z)
// extend down to about y=-0.58 at their lowest, centered around y=-0.32:
// this sits a bit below that centroid, toward the lower/glowing tip of the
// tail, so the beam apex lands on the glow itself rather than mid-body.
// Exported for reuse by PiriFlybyScene.tsx / PiriAboutScene.tsx — same
// anchor point, not re-measured.
export const ABDOMEN_LOCAL = new THREE.Vector3(0, -0.5, -0.9);

// The chest-glow plane's own position/scale (see the <mesh> in the JSX
// below) — exported so the two newer scenes render the identical overlay
// instead of omitting it (its absence was a big part of why they read
// noticeably darker/flatter than the hero: the "clearly visible blue chest
// light" simply wasn't there).
export const CHEST_GLOW_POSITION: [number, number, number] = [0, 0.12, 0.8];
export const CHEST_GLOW_SCALE: [number, number, number] = [0.55, 0.6, 1];

// Entrance: off-screen left, sweeping in and decelerating toward the orbit.
const ENTRANCE_POINTS: Array<[number, number, number]> = [
  [-1.55, -0.5, -0.35],
  [-1.05, -0.32, -0.18],
  [-0.55, -0.08, -0.02],
  [-0.12, 0.05, 0.04],
];

// One loop around the hero's center — parametrically generated with a small
// one-time random jitter per point so it reads as hand-flown rather than a
// mathematically perfect circle.
const ORBIT_CENTER = { x: 0, y: 0.08 };
const ORBIT_RADIUS = { x: 0.44, y: 0.36 };
const ORBIT_START_ANGLE = -0.4;
const ORBIT_SWEEP = Math.PI * 2 * 1.04;
const ORBIT_POINT_COUNT = 7;

function buildOrbitPoints(): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = [];
  for (let i = 0; i < ORBIT_POINT_COUNT; i++) {
    const t = i / (ORBIT_POINT_COUNT - 1);
    // Softer jitter than before (was +/-0.12 angle, +/-16% radius) — the
    // orbit should feel hand-flown, not visibly zig-zagged between points.
    const angle = ORBIT_START_ANGLE + ORBIT_SWEEP * t + (Math.random() - 0.5) * 0.06;
    const rx = ORBIT_RADIUS.x * (1 + (Math.random() - 0.5) * 0.08);
    const ry = ORBIT_RADIUS.y * (1 + (Math.random() - 0.5) * 0.08);
    const x = ORBIT_CENTER.x + Math.cos(angle) * rx;
    const y = ORBIT_CENTER.y + Math.sin(angle) * ry;
    const z = (Math.random() - 0.5) * 0.06;
    points.push([x, y, z]);
  }
  // Force the loop's start to match the entrance's final point exactly, so
  // there's no visible jump at the entrance -> orbit handoff.
  points[0] = [ENTRANCE_POINTS[ENTRANCE_POINTS.length - 1][0], ENTRANCE_POINTS[ENTRANCE_POINTS.length - 1][1], 0];
  return points;
}

// A fixed, hand-tuned resting orientation (not derived from the flight
// tangent): Piri faces the camera nearly dead-on during hover/charge/reveal
// — chest forward, wings symmetric, abdomen hanging below the thorax. A
// near-identity rotation (only a few degrees of nose-down tilt) was chosen
// numerically (scripts/tune_frontfacing_pose.mjs), by projecting the chest
// and abdomen anchors through the runtime camera and confirming both a
// strong "facing camera" score and a clear, symmetric vertical separation
// between chest and abdomen. An earlier, much more dramatic pitch/yaw (-40/
// 345/8) technically put the abdomen below the chest too, but at a strong
// three-quarter angle that read as "rotated away" rather than front-facing.
//
// Exported as the SINGLE source of truth for "front-facing" — reused
// verbatim (not re-derived/guessed) by PiriAboutScene.tsx as its final
// settle rotation, since it's the same already-validated pose.
export const REST_EULER = new THREE.Euler(THREE.MathUtils.degToRad(-3), 0, 0);
export const REST_QUATERNION = new THREE.Quaternion().setFromEuler(REST_EULER);

const ORIENTATION_SETTLE_WINDOW = 1.0;

// Abdomen is the only intended "light source": the body keeps a low, fixed
// sheen instead of a charge-driven pulse across wings/head/eyes. Exported
// (with tunePiriMaterials below) so PiriFlybyScene.tsx and PiriAboutScene.tsx
// apply the exact same tuning to their own clones — this was previously
// only ever done here, so both newer scenes rendered at whatever emissive
// intensity the raw GLTF happened to be authored with (inconsistent with,
// and generally darker/flatter than, the hero).
export const PIRI_EMISSIVE_INTENSITY = 0.35;

export function tunePiriMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat && !Array.isArray(mat) && mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = PIRI_EMISSIVE_INTENSITY;
    }
  });
}

// ---- Shared soft-glow sprite texture (abdomen light + trail) --------------

// Exported and reused as-is by PiriFlybyScene.tsx for its trail sprites —
// the same shared, cached canvas texture, not a second one.
let glowTextureCache: THREE.CanvasTexture | null = null;
export function getGlowTexture() {
  if (glowTextureCache) return glowTextureCache;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const r = size / 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  // Slightly stronger mid/outer stops than before (a touch more visible
  // blue-white without changing the sprite's own scale) — still capped well
  // short of a bloom: the outer stop still reaches fully transparent.
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(215,240,255,0.9)');
  gradient.addColorStop(0.65, 'rgba(130,198,255,0.34)');
  gradient.addColorStop(1, 'rgba(95,175,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  glowTextureCache = new THREE.CanvasTexture(canvas);
  return glowTextureCache;
}

const TRAIL_POOL_SIZE = 9;
const TRAIL_EMIT_INTERVAL = 0.16;
const TRAIL_FADE_DURATION = 0.9;
const TRAIL_DRIFT_SPEED = 0.05;
// Fraction of TRAIL_FADE_DURATION spent rising in rather than appearing at
// full brightness the instant a point is emitted — avoids a one-frame
// "pop," same fast-rise-then-longer-tail character as the rest of the fade.
const TRAIL_RISE_FRAC = 0.08;

// A larger, dimmer sprite around the same abdomen anchor as the core glow —
// never an independent light: same position, same charge/bodyOpacity gate,
// only its own (phase-lagged, see getAtmosphereBreath) breath and a lower
// opacity ceiling distinguish it, so it reads as the core's own halo rather
// than a second floating orb. Exported (with ABDOMEN_GLOW_PEAK_OPACITY/SCALE
// below) so the two newer scenes can render the same steady peak look
// without needing the hero's own charge/breath timeline.
export const ATMOSPHERE_SCALE_BASE = 0.5;
const ATMOSPHERE_SCALE_CHARGE = 0.35;
// Slightly stronger than before (0.22) so the halo reads a touch more
// visibly blue-white without growing its size or turning into its own
// bloom — intensity, not scale.
export const ATMOSPHERE_PEAK_OPACITY = 0.27;
// The core abdomen sprite's own peak scale/opacity at full charge (see
// `glowLevel`/`scale` in the useFrame below: opacity maxes at
// glowLevel*bodyOpacity*breath ~= 1, scale maxes at 0.22 + 1*0.5 = 0.72).
export const ABDOMEN_GLOW_PEAK_SCALE = 0.72;
export const ABDOMEN_GLOW_PEAK_OPACITY = 1;

// After the beam has already fully fired (holdEnd), the tail keeps a small
// restrained glow instead of hard-cutting to 0 — "after the beam fades, the
// tail should keep a calm subtle breath" / "Piri remains alive." This never
// touches anything BEFORE holdEnd (entrance/orbit/approach/hover/charge/
// reveal/hold are all untouched, so the light still can't appear earlier
// than the existing storyboard already allows) — it only softens what
// happens to a charge value that was already fully cycled through 0->1->0.
// The ramp-in starts exactly at holdEnd, the same instant getAbdomenCharge's
// own fall curve already reaches exactly 0, so there is no jump at the seam.
const ABDOMEN_AMBIENT_FLOOR = 0.12;
const ABDOMEN_AMBIENT_FLOOR_RAMP = 1.5; // seconds after holdEnd for the floor to fade in

export default function PiriModel({ resetSignal = 0 }: { resetSignal?: number }) {
  const { scene } = useGLTF(MODEL_URL);
  const chestTexture = useTexture(chestGlowUrl);
  const glowTexture = useMemo(() => getGlowTexture(), []);

  const flightGroup = useRef<THREE.Group>(null);
  const abdomenAnchor = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  const wingLeft = useRef<THREE.Object3D | null>(null);
  const wingRight = useRef<THREE.Object3D | null>(null);
  const restLeft = useRef(new THREE.Quaternion());
  const restRight = useRef(new THREE.Quaternion());
  const restScaleLeft = useRef(new THREE.Vector3(1, 1, 1));
  const restScaleRight = useRef(new THREE.Vector3(1, 1, 1));
  const wingDelta = useRef(new THREE.Quaternion());
  const wingSpeedSeed = useRef(Math.random() * 100);

  const bodyMaterial = useRef<THREE.MeshStandardMaterial | null>(null);
  const chestMaterial = useRef<THREE.MeshBasicMaterial | null>(null);
  const abdomenGlow = useRef<THREE.Sprite>(null);
  const atmosphereGlow = useRef<THREE.Sprite>(null);

  const trailGroup = useRef<THREE.Group>(null);
  const trailSprites = useRef<THREE.Sprite[]>([]);
  const trailAges = useRef<number[]>(new Array(TRAIL_POOL_SIZE).fill(Infinity));
  const trailNextIndex = useRef(0);
  const trailEmitTimer = useRef(0);

  const { viewport, camera } = useThree();

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Checked once at mount, same pattern as reducedMotion above — the intro
  // is a one-shot sequence, not something that needs to react to live
  // resizing/rotation mid-playback. getModelScale is a continuous ramp (see
  // logoLayout.ts) rather than a hard mobile/desktop switch.
  const modelScale = useMemo(() => getModelScale(typeof window !== 'undefined' ? window.innerWidth : 1920), []);

  useEffect(() => {
    const rawLeft = scene.getObjectByName('Wing_Left') as THREE.Object3D | undefined;
    const rawRight = scene.getObjectByName('Wing_Right') as THREE.Object3D | undefined;

    wingLeft.current = rigWingHinge(rawLeft ?? null, WING_ROOT_LOCAL.Wing_Left);
    wingRight.current = rigWingHinge(rawRight ?? null, WING_ROOT_LOCAL.Wing_Right);

    if (wingLeft.current) {
      restLeft.current.copy(wingLeft.current.quaternion);
      restScaleLeft.current.copy(wingLeft.current.scale);
    }
    if (wingRight.current) {
      restRight.current.copy(wingRight.current.quaternion);
      restScaleRight.current.copy(wingRight.current.scale);
    }

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as THREE.Mesh).isMesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && !Array.isArray(mat) && mat.emissiveIntensity !== undefined) {
          bodyMaterial.current = mat;
        }
      }
    });
    tunePiriMaterials(scene);
  }, [scene]);

  useEffect(() => {
    elapsed.current = 0;
    introState.elapsed = 0;
    introState.resetSignal += 1;
    if (bodyMaterial.current) {
      bodyMaterial.current.transparent = false;
      bodyMaterial.current.opacity = 1;
    }
    if (chestMaterial.current) chestMaterial.current.opacity = 1;
    if (flightGroup.current) flightGroup.current.visible = true;
    trailAges.current.fill(Infinity);
    trailSprites.current.forEach((s) => {
      s.visible = false;
    });
  }, [resetSignal]);

  const lookMatrix = useMemo(() => new THREE.Matrix4(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const restingQuat = useMemo(() => new THREE.Quaternion(), []);
  const p0 = useMemo(() => new THREE.Vector3(), []);
  const p1 = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const flapQuat = useMemo(() => new THREE.Quaternion(), []);
  const twistQuat = useMemo(() => new THREE.Quaternion(), []);
  const abdomenWorldPos = useMemo(() => new THREE.Vector3(), []);
  const projectionScratch = useMemo(() => new THREE.Vector3(), []);
  const hoverTarget = useRef({ x: 0, y: 0 });

  const orbitPointsRef = useRef<Array<[number, number, number]> | null>(null);
  if (!orbitPointsRef.current) orbitPointsRef.current = buildOrbitPoints();

  const curves = useMemo(() => {
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;

    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const hover = getHoverTargetFrac(w, h);
    const targetX = (hover.xFrac - 0.5) * 2;
    const targetY = -(hover.yFrac - 0.5) * 2;
    hoverTarget.current = { x: targetX * halfW, y: targetY * halfH };

    const toVec = ([x, y, z]: [number, number, number]) => new THREE.Vector3(x * halfW, y * halfH, z);

    const entrancePts = ENTRANCE_POINTS.map(toVec);
    const entranceCurve = new THREE.CatmullRomCurve3(entrancePts, false, 'catmullrom', 0.5);

    const orbitPts = orbitPointsRef.current!.map(toVec);
    const orbitCurve = new THREE.CatmullRomCurve3(orbitPts, false, 'catmullrom', 0.5);

    const orbitEndPt = orbitPts[orbitPts.length - 1];
    const approachPt = orbitEndPt
      .clone()
      .lerp(new THREE.Vector3(targetX * halfW, targetY * halfH, 0), 0.55)
      .add(new THREE.Vector3(0, halfH * 0.03, 0));
    const hoverArrivePts = [orbitEndPt.clone(), approachPt, new THREE.Vector3(targetX * halfW, targetY * halfH, 0)];
    const hoverArriveCurve = new THREE.CatmullRomCurve3(hoverArrivePts, false, 'catmullrom', 0.5);

    return { entranceCurve, orbitCurve, hoverArriveCurve };
  }, [viewport.width, viewport.height]);

  useFrame((_, delta) => {
    if (reducedMotion) {
      introState.elapsed = TIMELINE.settleEnd;
      if (flightGroup.current) flightGroup.current.visible = false;
      return;
    }

    elapsed.current += delta;
    introState.elapsed = elapsed.current;

    if (viewport.width === 0 || viewport.height === 0) return;
    if (!flightGroup.current) return;

    const e = elapsed.current;
    const eps = 0.0015;

    let tangentValid = false;

    if (e < TIMELINE.entranceEnd) {
      const t = getEntranceProgress(e);
      curves.entranceCurve.getPoint(t, p0);
      curves.entranceCurve.getPoint(Math.min(1, t + eps), p1);
      tangentValid = true;
    } else if (e < TIMELINE.orbitEnd) {
      const t = getOrbitProgress(e);
      curves.orbitCurve.getPoint(t, p0);
      curves.orbitCurve.getPoint(Math.min(1, t + eps), p1);
      tangentValid = true;
    } else if (e < TIMELINE.hoverArriveEnd) {
      const t = getHoverArriveProgress(e);
      curves.hoverArriveCurve.getPoint(t, p0);
      curves.hoverArriveCurve.getPoint(Math.min(1, t + eps), p1);
      tangentValid = true;
    } else if (e < TIMELINE.holdEnd) {
      p0.set(hoverTarget.current.x, hoverTarget.current.y, 0);
    } else if (e < TIMELINE.exitEnd) {
      const t = getExitProgress(e);
      const rise = THREE.MathUtils.lerp(0, viewport.height * 1.3, t);
      const drift = THREE.MathUtils.lerp(0, viewport.width * 0.08, easeOutCubic(t));
      p0.set(hoverTarget.current.x + drift, hoverTarget.current.y + rise, 0.05 * t);
    } else {
      flightGroup.current.visible = false;
      return;
    }

    // Hover personality: layered, incommensurate-frequency noise so the
    // idle motion never reads as one repeating loop. Kept extremely subtle
    // and — critically — expressed only as position drift plus a small
    // roll (rotation around the *viewing* axis, like a gentle head-tilt),
    // never pitch/yaw, so it can't rotate Piri's face away from the camera.
    const floatY =
      Math.sin(e * 1.3 + 0.7) * 0.016 + Math.sin(e * 0.53 + 2.1) * 0.011 + Math.sin(e * 2.05 + 4.4) * 0.005;
    const swayX = Math.sin(e * 0.71 + 1.1) * 0.013 + Math.sin(e * 1.9 + 3.3) * 0.005;
    const idleRoll =
      Math.sin(e * 0.9 + 2.4) * 0.022 +
      Math.sin(e * 0.37 + 5.1) * 0.009 +
      Math.sin(e * 1.47 + 0.3) * 0.012 +
      Math.sin(e * 0.29 + 1.8) * 0.006;

    // A small, single-bounce overshoot as Piri settles into hover — "slow
    // down before stopping, allow a tiny overshoot, then gently settle."
    const settleBounce = getHoverSettleBounce(e) * 0.1;

    flightGroup.current.position.set(p0.x + swayX, p0.y + floatY + settleBounce, p0.z);

    if (tangentValid && tangent.copy(p1).sub(p0).lengthSq() > 1e-8) {
      tangent.normalize();
      lookMatrix.lookAt(p0, p1, UP);
      targetQuat.setFromRotationMatrix(lookMatrix).multiply(NOSE_CORRECTION);
    }

    const settleT = THREE.MathUtils.clamp(
      (e - (TIMELINE.hoverArriveEnd - ORIENTATION_SETTLE_WINDOW)) / ORIENTATION_SETTLE_WINDOW,
      0,
      1,
    );
    restingQuat.copy(tangentValid ? targetQuat : restingQuat).slerp(REST_QUATERNION, tangentValid ? settleT * settleT : 1);

    // During exit, a real nose-up pitch (rotation around the local X axis,
    // not the idle roll above) so the departure reads as deliberate climbing
    // flight rather than a sideways tilt.
    let exitPitch = 0;
    if (e >= TIMELINE.holdEnd) {
      const exitT = getExitProgress(e);
      exitPitch = -0.22 * exitT;
    }
    restingQuat.multiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(exitPitch, 0, idleRoll * (1 - settleT * 0.5))),
    );

    if (Number.isFinite(restingQuat.x) && Number.isFinite(restingQuat.w)) {
      const slerpSpeed = e < TIMELINE.hoverArriveEnd ? 0.16 : 0.09;
      flightGroup.current.quaternion.slerp(restingQuat, slerpSpeed);
    }

    // Wings: full energy while flying/orbiting/settling, a slow randomized
    // speed drift so the flap never feels perfectly metronomic, then a tiny
    // residual flutter once hovering/charging/revealing, restored to full
    // energy again during exit.
    let wingIntensity: number;
    if (e < TIMELINE.hoverArriveEnd) wingIntensity = 1;
    else if (e < TIMELINE.hoverIdleEnd) {
      wingIntensity = THREE.MathUtils.lerp(1, 0.4, (e - TIMELINE.hoverArriveEnd) / (TIMELINE.hoverIdleEnd - TIMELINE.hoverArriveEnd));
    } else if (e < TIMELINE.chargeEnd) {
      wingIntensity = THREE.MathUtils.lerp(0.4, 0.14, (e - TIMELINE.hoverIdleEnd) / (TIMELINE.chargeEnd - TIMELINE.hoverIdleEnd));
    } else if (e < TIMELINE.holdEnd) {
      wingIntensity = 0.14;
    } else if (e < TIMELINE.exitEnd) {
      wingIntensity = THREE.MathUtils.lerp(0.14, 1, Math.min(1, (e - TIMELINE.holdEnd) / 0.6));
    } else {
      wingIntensity = 0;
    }

    const speedDrift = 1 + Math.sin(e * 0.31 + wingSpeedSeed.current) * 0.06;
    const flapSpeed = WING_FLAP_SPEED * speedDrift * (0.3 + 0.7 * wingIntensity);
    const flapPhase = e * flapSpeed;
    // A touch of the second harmonic makes the down-stroke reach a slightly
    // stronger peak than the up-stroke recovers to — asymmetric, not a
    // mirrored sine — then renormalized so the stronger peak still lands at
    // the same WING_FLAP_AMPLITUDE as before.
    const flapWave =
      (Math.sin(flapPhase) + WING_ASYMMETRY * Math.sin(flapPhase * 2 - Math.PI / 2)) / (1 + WING_ASYMMETRY);
    const flapAngle = flapWave * WING_FLAP_AMPLITUDE * wingIntensity;
    const twistAngle = Math.cos(flapPhase) * WING_TWIST_AMPLITUDE * wingIntensity;

    const applyWingFlap = (
      wing: THREE.Object3D | null,
      rest: THREE.Quaternion,
      restScale: THREE.Vector3,
      sign: number,
    ) => {
      if (!wing) return;
      const signedFlap = flapAngle * sign;
      flapQuat.setFromAxisAngle(WING_FLAP_AXIS, signedFlap);
      twistQuat.setFromAxisAngle(WING_TWIST_AXIS, twistAngle * sign);
      wingDelta.current.copy(flapQuat).multiply(twistQuat);
      wing.quaternion.copy(rest).multiply(wingDelta.current);
      // Squash scales with the stroke's own current strength (already
      // carries wingIntensity via flapAngle), so it fades out with the flap
      // itself instead of staying full-size during the residual flutter.
      const squash = 1 - Math.max(0, signedFlap / WING_FLAP_AMPLITUDE) * WING_SQUASH_AMOUNT;
      wing.scale.set(restScale.x, restScale.y * squash, restScale.z);
    };

    applyWingFlap(wingLeft.current, restLeft.current, restScaleLeft.current, WING_FLAP_SIGN.Wing_Left);
    applyWingFlap(wingRight.current, restRight.current, restScaleRight.current, WING_FLAP_SIGN.Wing_Right);

    // Body fade: fully opaque through the whole sequence except the final
    // 20% of the exit, when it eases out as it clears the top of the view.
    const bodyOpacity = e >= TIMELINE.holdEnd ? getExitBodyOpacity(e) : 1;
    if (bodyMaterial.current) {
      if (bodyOpacity < 1) {
        bodyMaterial.current.transparent = true;
        bodyMaterial.current.opacity = bodyOpacity;
      }
    }
    if (chestMaterial.current) chestMaterial.current.opacity = bodyOpacity;

    // Abdomen glow: the only light source, driven by charge/beam as before —
    // `breath` is a subtle multiplier on top, never a source of its own, so
    // the glow still can't appear before getAbdomenCharge already allows it
    // (charge 0 * anything = 0). It only keeps an already-lit tail from
    // sitting perfectly flat, the way a real bioluminescent light doesn't.
    // `energy` reuses the already-computed wingIntensity (no new clock) so
    // the breath widens a little during active flight and calms during
    // hover, per "slightly more energetic during acceleration, calmer
    // during hover."
    const charge = getAbdomenCharge(e);
    const energy = wingIntensity;
    const breath = getAbdomenBreath(e, energy);
    const ambientFloor =
      e >= TIMELINE.holdEnd
        ? ABDOMEN_AMBIENT_FLOOR * easeOutCubic((e - TIMELINE.holdEnd) / ABDOMEN_AMBIENT_FLOOR_RAMP)
        : 0;
    const glowLevel = Math.max(charge, ambientFloor);
    if (abdomenGlow.current) {
      const mat = abdomenGlow.current.material as THREE.SpriteMaterial;
      mat.opacity = glowLevel * bodyOpacity * breath;
      const scale = 0.22 + charge * 0.5;
      abdomenGlow.current.scale.setScalar(scale);
    }
    // Atmosphere: a larger, dimmer halo around the exact same anchor, gated
    // by the same charge/bodyOpacity as the core — it can only ever be
    // visible when the core already is, so it reads as the core's own
    // support, not an independent light. Its breath is phase-lagged behind
    // the core's (see ATMOSPHERE_BREATH_LAG) for the same reason the
    // reference's halo trails its core.
    if (atmosphereGlow.current) {
      const atmosphereBreath = getAtmosphereBreath(e, energy);
      const mat = atmosphereGlow.current.material as THREE.SpriteMaterial;
      mat.opacity = glowLevel * bodyOpacity * atmosphereBreath * ATMOSPHERE_PEAK_OPACITY;
      const scale = ATMOSPHERE_SCALE_BASE + charge * ATMOSPHERE_SCALE_CHARGE;
      atmosphereGlow.current.scale.setScalar(scale);
    }

    // Project the abdomen's real world position to the screen every frame
    // so the DOM beam can track it exactly, independent of HOVER_TARGET.
    flightGroup.current.updateMatrixWorld(true);
    if (abdomenAnchor.current) {
      abdomenAnchor.current.getWorldPosition(abdomenWorldPos);
      projectionScratch.copy(abdomenWorldPos).project(camera);
      introState.abdomenXFrac = projectionScratch.x * 0.5 + 0.5;
      introState.abdomenYFrac = 1 - (projectionScratch.y * 0.5 + 0.5);
    }

    // Trail: emit while flying/orbiting (and briefly during exit), fade
    // and slowly drift each active point independently.
    const emitStrength = getTrailEmitStrength(e);
    trailEmitTimer.current += delta;
    if (emitStrength > 0 && trailEmitTimer.current >= TRAIL_EMIT_INTERVAL) {
      trailEmitTimer.current = 0;
      const idx = trailNextIndex.current % TRAIL_POOL_SIZE;
      trailNextIndex.current += 1;
      const sprite = trailSprites.current[idx];
      if (sprite) {
        sprite.position.copy(abdomenWorldPos);
        sprite.visible = true;
        trailAges.current[idx] = 0;
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
      // Quick rise (avoids an instant "pop" the frame a point is emitted),
      // then the same front-loaded decay as before over the remaining
      // duration — same overall TRAIL_FADE_DURATION either way.
      const p = age / TRAIL_FADE_DURATION;
      const fade =
        p < TRAIL_RISE_FRAC
          ? easeOutCubic(p / TRAIL_RISE_FRAC)
          : 1 - easeOutCubic((p - TRAIL_RISE_FRAC) / (1 - TRAIL_RISE_FRAC));
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.opacity = fade * 0.55;
      sprite.scale.setScalar(0.1 + fade * 0.06);
      sprite.position.y += TRAIL_DRIFT_SPEED * delta;
    }
  });

  return (
    <>
      <group ref={flightGroup}>
        <group scale={modelScale}>
          <primitive object={scene} />
          <mesh position={[0, 0.12, 0.8]} scale={[0.55, 0.6, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              ref={chestMaterial}
              map={chestTexture}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <group ref={abdomenAnchor} position={ABDOMEN_LOCAL}>
            {/* Rendered first so it sits behind the core glow — the halo
                supporting the light, not a second light beside it. */}
            <sprite ref={atmosphereGlow} scale={[ATMOSPHERE_SCALE_BASE, ATMOSPHERE_SCALE_BASE, ATMOSPHERE_SCALE_BASE]}>
              <spriteMaterial
                map={glowTexture}
                transparent
                opacity={0}
                depthWrite={false}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
            <sprite ref={abdomenGlow} scale={[0.22, 0.22, 0.22]}>
              <spriteMaterial
                map={glowTexture}
                transparent
                opacity={0}
                depthWrite={false}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
          </group>
        </group>
      </group>
      <group ref={trailGroup}>
        {Array.from({ length: TRAIL_POOL_SIZE }, (_, i) => (
          <sprite
            key={i}
            visible={false}
            ref={(s) => {
              if (s) trailSprites.current[i] = s;
            }}
          >
            <spriteMaterial
              map={glowTexture}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        ))}
      </group>
    </>
  );
}

useGLTF.preload(MODEL_URL);
