// Single source of truth for the hero's one-shot cinematic timeline. Every
// visual (the flight path, wing energy, abdomen charge, beam, logo reveal,
// exit) is a pure function of one number — seconds elapsed since the
// sequence started — so the WebGL scene and the DOM overlay, which run in
// two separate render loops, can never drift out of sync: they just
// evaluate the same math against the same clock.

export const TIMELINE = {
  entranceEnd: 3.1, // fly in from the left, decelerating (slowed for a more graceful glide)
  orbitEnd: 6.1, // + 3.0s one imperfect loop around the hero center (slowed)
  hoverArriveEnd: 7.3, // + 1.2s settle into the hover position (slower, allows overshoot+settle)
  hoverIdleEnd: 8.0, // + 0.7s pre-charge beat
  chargeEnd: 9.0, // + 1.0s abdomen charges
  revealEnd: 11.3, // + 2.3s beam + logo reveal (icon -> wordmark -> studio)
  holdEnd: 12.45, // + 1.15s beam/glow fade out, Piri still fully visible (slightly longer)
  exitEnd: 14.45, // + 2.0s flies up and off-screen (longer, softer acceleration)
  settleEnd: 15.45, // + 1.0s residual particles fade to final calm state
};

export type IntroPhase =
  | 'entrance'
  | 'orbit'
  | 'hoverArrive'
  | 'hoverIdle'
  | 'charge'
  | 'reveal'
  | 'hold'
  | 'exit'
  | 'settled';

export function getPhase(elapsed: number): IntroPhase {
  if (elapsed < TIMELINE.entranceEnd) return 'entrance';
  if (elapsed < TIMELINE.orbitEnd) return 'orbit';
  if (elapsed < TIMELINE.hoverArriveEnd) return 'hoverArrive';
  if (elapsed < TIMELINE.hoverIdleEnd) return 'hoverIdle';
  if (elapsed < TIMELINE.chargeEnd) return 'charge';
  if (elapsed < TIMELINE.revealEnd) return 'reveal';
  if (elapsed < TIMELINE.holdEnd) return 'hold';
  if (elapsed < TIMELINE.exitEnd) return 'exit';
  return 'settled';
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function easeOutCubic(t: number) {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

export function easeInCubic(t: number) {
  const c = clamp01(t);
  return c * c * c;
}

export function easeInOutSine(t: number) {
  const c = clamp01(t);
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

// ---- Cubic-bezier easing (CSS-style, Newton-Raphson solve) ---------------
//
// Each flight-path segment below gets its own hand-picked curve instead of
// sharing one generic easing function — the "no two motions share a curve"
// principle from the Luz Viva motion reference
// (docs/references/luz-viva-system/). This only changes the in-between
// velocity shape of each segment; the input is still raw 0..1 progress
// through the exact same TIMELINE window, so every waypoint and phase
// boundary is untouched.
function makeCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
  const B = (a1: number, a2: number) => 3 * a2 - 6 * a1;
  const C = (a1: number) => 3 * a1;

  const calcBezier = (t: number, a1: number, a2: number) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const getSlope = (t: number, a1: number, a2: number) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);

  function solveTForX(x: number) {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const slope = getSlope(t, x1, x2);
      if (Math.abs(slope) < 1e-6) break;
      t -= (calcBezier(t, x1, x2) - x) / slope;
    }
    return t;
  }

  return (t: number) => {
    const c = clamp01(t);
    if (c === 0 || c === 1) return c;
    return calcBezier(solveTForX(c), y1, y2);
  };
}

// ---- Flight progress, one per segment ------------------------------------

// Gentle, decelerating launch that settles into the orbit handoff — same
// "effortless glide, not a mechanical slide-in" intent as before, now its
// own bespoke curve (Material Design's "standard" easing shape: quick to
// get moving, long unhurried deceleration) instead of a smoothstep+power
// composition.
const easeEntranceFlight = makeCubicBezier(0.4, 0, 0.2, 1);

export function getEntranceProgress(elapsed: number) {
  const raw = clamp01(elapsed / TIMELINE.entranceEnd);
  return easeEntranceFlight(raw);
}

// Flat, steady middle with soft ends on both sides — keeps the loop's
// entry/exit from reading as an abrupt heading change, same intent as the
// previous nested easeInOutSine pass, now a single bespoke curve so it no
// longer shares its shape with the logo reveal / scroll hold-phase.
const easeOrbitFlight = makeCubicBezier(0.455, 0.03, 0.515, 0.955);

export function getOrbitProgress(elapsed: number) {
  const raw = clamp01((elapsed - TIMELINE.entranceEnd) / (TIMELINE.orbitEnd - TIMELINE.entranceEnd));
  return easeOrbitFlight(raw);
}

// The final approach into hover, corrected: a plain ease-out-heavy bezier
// front-loads its velocity right at the handoff from orbit — the segment
// is already moving fastest the instant it starts, which is exactly what
// read as a sudden launch/snap leaving the right-side position. This
// dedicated curve instead ramps up gently (smoothstep has zero slope at
// t=0, so there's no instant burst), reaches most of the distance across
// the segment's own middle third, then spends the back half of the
// duration on a long, progressively slower glide into the landing — same
// "controlled momentum -> early braking -> gentle glide -> subtle settle"
// shape as the entrance curve's family, tuned with a stronger tail power so
// deceleration begins noticeably earlier and holds longer. Distinct from
// easeEntranceFlight (own exponent, own purpose) rather than reused.
function easeFinalApproach(t: number) {
  const c = clamp01(t);
  const launched = c * c * (3 - 2 * c); // smoothstep: zero slope at both ends
  return 1 - Math.pow(1 - launched, 3.4);
}

export function getHoverArriveProgress(elapsed: number) {
  const raw = clamp01((elapsed - TIMELINE.orbitEnd) / (TIMELINE.hoverArriveEnd - TIMELINE.orbitEnd));
  return easeFinalApproach(raw);
}

// A small, single-bounce overshoot-and-settle envelope: 0 through most of
// hoverArrive, rises as Piri approaches the hover point, briefly swings
// slightly past it, then decays back to 0 as it settles — "slow down before
// stopping, allow a tiny overshoot, then gently settle." Extends a little
// past hoverArriveEnd into hoverIdle so the settle itself feels continuous.
export function getHoverSettleBounce(elapsed: number) {
  const start = TIMELINE.hoverArriveEnd - 0.4;
  const duration = 0.9;
  const t = elapsed - start;
  if (t < 0) return 0;
  const localT = clamp01(t / duration);
  return Math.sin(localT * Math.PI * 1.25) * Math.exp(-localT * 3.4);
}

// ---- Abdomen charge / beam / reveal ---------------------------------------

// 0 while flying/orbiting/settling, ramps through "charge", stays lit
// through "reveal", then fades out during "hold" — fully off before "exit"
// begins, per the corrected ordering (beam disappears before Piri leaves).
export function getAbdomenCharge(elapsed: number) {
  if (elapsed < TIMELINE.hoverIdleEnd) return 0;
  if (elapsed < TIMELINE.chargeEnd) {
    return easeOutCubic((elapsed - TIMELINE.hoverIdleEnd) / (TIMELINE.chargeEnd - TIMELINE.hoverIdleEnd));
  }
  if (elapsed < TIMELINE.revealEnd) return 1;
  if (elapsed < TIMELINE.holdEnd) {
    return 1 - easeOutCubic((elapsed - TIMELINE.revealEnd) / (TIMELINE.holdEnd - TIMELINE.revealEnd));
  }
  return 0;
}

export function getBeamOpacity(elapsed: number) {
  if (elapsed < TIMELINE.chargeEnd) return 0;
  const riseEnd = TIMELINE.chargeEnd + (TIMELINE.revealEnd - TIMELINE.chargeEnd) * 0.15;
  if (elapsed < riseEnd) {
    return easeOutCubic((elapsed - TIMELINE.chargeEnd) / (riseEnd - TIMELINE.chargeEnd));
  }
  if (elapsed < TIMELINE.revealEnd) return 1;
  if (elapsed < TIMELINE.holdEnd) {
    // A long, natural release rather than a mirror of the rise: opacity
    // lingers well above zero through the middle of this window and only
    // tapers fully away near the very end of it — same holdEnd boundary
    // (0 exactly at holdEnd) as before, just a gentler interior curve.
    const fallT = (elapsed - TIMELINE.revealEnd) / (TIMELINE.holdEnd - TIMELINE.revealEnd);
    return Math.pow(1 - fallT, 0.6);
  }
  return 0;
}

// 0..1 progress of the top-to-bottom logo reveal, mapped by the caller onto
// LOGO_BANDS so it naturally lands as icon, then wordmark, then studio+lines.
export function getRevealProgress(elapsed: number) {
  if (elapsed < TIMELINE.chargeEnd) return 0;
  return easeInOutSine((elapsed - TIMELINE.chargeEnd) / (TIMELINE.revealEnd - TIMELINE.chargeEnd));
}

// Small, slow multi-frequency wobble in [-1, 1] for "living light" —
// deliberately not a single clean sine so it doesn't read as mechanical.
// `seed` offsets the phase so independent uses (brightness, bloom, particle
// density) don't move in lockstep.
export function getLivingFlicker(elapsed: number, seed = 0) {
  return (
    Math.sin(elapsed * 1.7 + seed) * 0.5 +
    Math.sin(elapsed * 3.1 + seed * 1.3) * 0.3 +
    Math.sin(elapsed * 0.6 + seed * 2.1) * 0.2
  );
}

// ---- Abdomen "living light" breathing --------------------------------------
//
// A small, continuous, asymmetric envelope (quick intake, longer release —
// same character as the Luz Viva reference's core breath) that PiriModel
// multiplies onto its own charge-driven glow opacity. It is purely a
// multiplier: with charge at 0 the glow stays at 0 regardless of breath, so
// this can never make the light appear earlier than getAbdomenCharge already
// allows — it only keeps the light from going dead-flat once charge is on.
const BREATH_PERIOD = 4.6; // seconds, independent of TIMELINE — an idle loop, not a phase
const BREATH_INTAKE_FRAC = 0.22; // asymmetric: quicker rise than release, never symmetrical
const BREATH_MIN = 0.9; // shallow dip while calm — subtle, never reads as a mechanical strobe
const BREATH_MIN_ENERGETIC = 0.82; // a slightly wider swing while Piri is actively flying
const ATMOSPHERE_BREATH_LAG = 0.4; // seconds the outer atmosphere trails the core's own breath

function breathHump(t: number, period: number, intakeFrac: number) {
  const phase = (((t % period) + period) % period) / period;
  const shaped = phase < intakeFrac ? (phase / intakeFrac) * 0.5 : 0.5 + ((phase - intakeFrac) / (1 - intakeFrac)) * 0.5;
  return 0.5 - 0.5 * Math.cos(shaped * Math.PI * 2);
}

// `energy` (0..1, default 0 = calm) widens the breath's own swing without
// touching its period or asymmetry — reusing the SAME clock/rhythm ("the
// Living Core owns the rhythm"), just how deep the dip goes. PiriModel
// passes its existing per-frame `wingIntensity` as this value, so the tail
// reads a little more energetic during flight and calms during hover
// without any new clock or per-motion animation of its own.
export function getAbdomenBreath(elapsed: number, energy = 0) {
  const floor = BREATH_MIN - (BREATH_MIN - BREATH_MIN_ENERGETIC) * clamp01(energy);
  return floor + (1 - floor) * breathHump(elapsed, BREATH_PERIOD, BREATH_INTAKE_FRAC);
}

// Phase-lagged variant for the larger, dimmer "atmosphere" sprite that
// supports the core glow — mirrors the reference's "halo lags the core"
// behaviour so the two layers don't pulse in perfect lockstep.
export function getAtmosphereBreath(elapsed: number, energy = 0) {
  const floor = BREATH_MIN - (BREATH_MIN - BREATH_MIN_ENERGETIC) * clamp01(energy);
  return floor + (1 - floor) * breathHump(elapsed - ATMOSPHERE_BREATH_LAG, BREATH_PERIOD, BREATH_INTAKE_FRAC);
}

// ---- Trail -----------------------------------------------------------------

// Emission strength for the glowing trail: on through entrance + orbit, on
// (sparser, scaled by the caller) for the first part of the exit, off
// otherwise.
export function getTrailEmitStrength(elapsed: number) {
  if (elapsed < TIMELINE.orbitEnd) return 1;
  if (elapsed >= TIMELINE.holdEnd && elapsed < TIMELINE.holdEnd + (TIMELINE.exitEnd - TIMELINE.holdEnd) * 0.6) {
    return 0.4;
  }
  return 0;
}

// ---- Exit ------------------------------------------------------------------

export function getExitLocalT(elapsed: number) {
  return clamp01((elapsed - TIMELINE.holdEnd) / (TIMELINE.exitEnd - TIMELINE.holdEnd));
}

// Position eases in with acceleration, but gently: a soft initial lift
// (near-zero starting speed) that builds continuously. Quadratic rather
// than cubic — the previous curve read as an explosive launch.
export function getExitProgress(elapsed: number) {
  return Math.pow(getExitLocalT(elapsed), 2.1);
}

// Body stays fully visible for the first 80% of the exit and only fades over
// the final 20%, so the audience clearly sees Piri fly away before it fades.
export function getExitBodyOpacity(elapsed: number) {
  const t = getExitLocalT(elapsed);
  if (t < 0.8) return 1;
  return 1 - easeOutCubic((t - 0.8) / 0.2);
}

export function isSequenceComplete(elapsed: number) {
  return elapsed >= TIMELINE.settleEnd;
}
