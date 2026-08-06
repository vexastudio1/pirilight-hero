// Timing/easing for the one-shot Mission -> Services "flyby" moment
// (PiriFlybyScene.tsx / PiriFlybyMoment.tsx). Deliberately separate from
// introTimeline.ts (the hero's own cinematic sequence) — different trigger
// (scroll-into-view, not page load), different actor lifecycle (mounts,
// plays exactly once, unmounts), its own short vocabulary. Reuses
// introTimeline's primitives rather than duplicating them.
import { clamp01, easeInOutSine, smootherstep } from './introTimeline';

// ~2x the original 1.55s pass — "about half the speed," still a confident
// cinematic cruise, not a slow drift.
export const FLYBY_DURATION = 3.1;

// How far past the visible frustum edge Piri starts/ends, as a multiple of
// half the flyby canvas's own viewport width — safely off-screen, not just
// at the edge, so there's no visible "pop-in".
export const FLYBY_EDGE_MARGIN = 1.2;

// Position progress: smootherstep gives a believable "accelerate -> steady
// cruise -> decelerate" feel (flatter middle, more pronounced ease at both
// ends than a plain sine) — "smooth acceleration at the beginning, a
// controlled cruise phase, gradual deceleration near the end," not a
// mechanical linear slide.
export function getFlybyProgress(elapsed: number): number {
  return smootherstep(clamp01(elapsed / FLYBY_DURATION));
}

// The instantaneous "speed" implied by getFlybyProgress — the analytic
// derivative of smootherstep (30t^2(1-t)^2), normalized so its peak (at the
// midpoint) is 1. Zero at both ends (matching the accel/decel curve's own
// zero velocity there), peaking mid-cruise. Drives wing intensity and
// banking so they're derived from the ACTUAL motion, not a separately
// invented curve — "stronger wing movement during acceleration, stable
// during cruise, reduced during deceleration" falls out of this directly.
export function getFlybySpeedFactor(elapsed: number): number {
  const t = clamp01(elapsed / FLYBY_DURATION);
  const raw = 30 * t * t * (1 - t) * (1 - t);
  return raw / 1.875; // 1.875 = the curve's own peak value at t=0.5
}

// Trail/glow intensity envelope — ramps up fast as Piri enters (so the
// trail is already near-peak by the time he's visible, not still ramping
// mid-frame), holds through the pass, eases out as he exits.
const INTENSITY_RISE_FRAC = 0.12;
const INTENSITY_FALL_FRAC = 0.22;

export function getFlybyIntensity(elapsed: number): number {
  const t = clamp01(elapsed / FLYBY_DURATION);
  if (t < INTENSITY_RISE_FRAC) return easeInOutSine(t / INTENSITY_RISE_FRAC);
  if (t > 1 - INTENSITY_FALL_FRAC) return easeInOutSine((1 - t) / INTENSITY_FALL_FRAC);
  return 1;
}
