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

// ---- Flight progress, one per segment ------------------------------------

// Smoothstep (eases in AND out) composed with a mild deceleration bias, so
// the launch itself is gentle instead of leaving off-screen at full speed —
// reads as an effortless glide rather than a mechanical slide-in.
function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

export function getEntranceProgress(elapsed: number) {
  const raw = clamp01(elapsed / TIMELINE.entranceEnd);
  const eased = smoothstep(raw);
  return 1 - Math.pow(1 - eased, 2.1);
}

// Nested easing gives a flatter, steadier middle and softer ends than a
// single sine pass — reduces the abrupt heading changes at the orbit's
// entry/exit while the per-point jitter (see PiriModel) keeps it imperfect.
export function getOrbitProgress(elapsed: number) {
  const raw = clamp01((elapsed - TIMELINE.entranceEnd) / (TIMELINE.orbitEnd - TIMELINE.entranceEnd));
  return easeInOutSine(easeInOutSine(raw));
}

export function getHoverArriveProgress(elapsed: number) {
  const raw = clamp01((elapsed - TIMELINE.orbitEnd) / (TIMELINE.hoverArriveEnd - TIMELINE.orbitEnd));
  return easeOutCubic(raw);
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
    return 1 - easeOutCubic((elapsed - TIMELINE.revealEnd) / (TIMELINE.holdEnd - TIMELINE.revealEnd));
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
