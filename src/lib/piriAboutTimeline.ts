// Timing/easing for the "Sobre a PiriLight" entrance moment
// (PiriAboutScene.tsx). Deliberately separate from introTimeline.ts (the
// hero's own one-shot sequence) and flybyTimeline.ts (the Mission ->
// Services pass) — different trigger, different actor lifecycle (mounts on
// first qualifying intersection, plays the entrance ONCE, then hovers
// indefinitely rather than exiting/unmounting), its own short vocabulary.
// Reuses introTimeline's primitives rather than duplicating them.
import { clamp01, easeInOutSine, easeOutCubic } from './introTimeline';

// Requested ranges: ~1.8-2.3s desktop, ~1.2-1.6s mobile — midpoints below,
// picked once and then the same continuous mobile/desktop switch used
// elsewhere in this codebase (see logoLayout.ts's own breakpoint style)
// rather than a hardcoded single value.
export const ABOUT_ENTRANCE_DURATION_DESKTOP = 2.05;
export const ABOUT_ENTRANCE_DURATION_MOBILE = 1.4;
const ABOUT_MOBILE_BREAKPOINT_PX = 640;

export function getAboutEntranceDuration(viewportWidthPx: number): number {
  return viewportWidthPx < ABOUT_MOBILE_BREAKPOINT_PX ? ABOUT_ENTRANCE_DURATION_MOBILE : ABOUT_ENTRANCE_DURATION_DESKTOP;
}

// Position along the flight curve — smooth cinematic ease over the whole
// entrance.
export function getAboutFlightProgress(t: number): number {
  return easeInOutSine(clamp01(t));
}

// The rotation-to-camera happens only across this final fraction of the
// entrance — "the final rotation toward the camera should happen during the
// last part of the entrance so Piri naturally settles into the front-facing
// position," not blended across the whole flight.
const FACE_ROTATE_FRAC = 0.32;

export function getAboutFaceRotateT(t: number): number {
  const start = 1 - FACE_ROTATE_FRAC;
  const local = clamp01(t);
  if (local < start) return 0;
  return easeOutCubic((local - start) / FACE_ROTATE_FRAC);
}

// Fade-in envelope for the entrance — Piri ramps up from transparent as he
// enters, avoiding a hard "pop" right at the circle's clipped edge, and
// also what prefers-reduced-motion reuses for its own gentle fade-to-center
// (no flight, no rotation, just opacity 0 -> 1).
const OPACITY_RISE_FRAC = 0.18;

export function getAboutOpacity(t: number): number {
  const local = clamp01(t);
  if (local >= OPACITY_RISE_FRAC) return 1;
  return easeOutCubic(local / OPACITY_RISE_FRAC);
}
