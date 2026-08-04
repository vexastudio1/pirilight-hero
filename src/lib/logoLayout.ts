// Single responsive sizing system for the whole hero composition — the
// logo, the beam, the brand statement, and Piri's own scale all derive from
// the constants in this file, so there is exactly one place that defines
// "how big things are at a given viewport size" instead of separate
// hardcoded values scattered across components and breakpoints.
//
// Two independent, CONTINUOUS (no breakpoint jumps) curves drive everything:
//
// 1. Logo width — a fluid clamp (floor, linear-with-viewport-width,
//    ceiling), mirrored 1:1 by the `--logo-width` custom property in
//    global.css. The beam (width AND height) and the brand statement (font
//    size) are all expressed as plain multiples of `--logo-width` in CSS,
//    so they scale together as one visual block by construction — there's
//    no separate "mobile logo formula" and "mobile beam formula" to keep in
//    sync, just one width driving everything downstream.
// 2. Piri's model scale — a separate linear ramp between a mobile and a
//    desktop value, read only in PiriModel.tsx (there's no CSS analog since
//    Piri is a 3D object, not a DOM element).
//
// Both curves are plain functions of viewport width, so there's no hard
// "mobile vs desktop" branch anywhere — just a smooth transition, matching
// real device widths continuously from phones through desktops.

export const LOGO_ASPECT = 1536 / 1024; // width / height

// ---- Logo width (mirrors `--logo-width` in global.css — keep in sync) ----
//
// width(vw) = clamp(FLOOR, COEFF * vw + BASE, CEILING)
//
// Chosen so the curve passes through ~178px at a 375px-wide phone (visibly
// bigger than the old flat mobile value, per the "logo should feel like the
// main focus" brief) and reaches the desktop ceiling (420px, unchanged from
// before) by ~1400px wide — the width old desktop screens already saw.
// Below ~256px viewport width the floor takes over as a safety net; above
// ~1400px the ceiling takes over, exactly matching prior desktop behavior.
export const LOGO_WIDTH_FLOOR_PX = 150;
export const LOGO_WIDTH_VW_COEFF = 0.235; // 23.5vw
export const LOGO_WIDTH_BASE_PX = 90;
export const LOGO_WIDTH_CEILING_PX = 420;

export function getLogoWidthPx(viewportWidthPx: number) {
  const preferred = LOGO_WIDTH_VW_COEFF * viewportWidthPx + LOGO_WIDTH_BASE_PX;
  return Math.min(LOGO_WIDTH_CEILING_PX, Math.max(LOGO_WIDTH_FLOOR_PX, preferred));
}

export function getLogoHeightPx(viewportWidthPx: number) {
  return getLogoWidthPx(viewportWidthPx) / LOGO_ASPECT;
}

// ---- Piri's model scale ----------------------------------------------------
//
// A plain linear ramp by viewport width: MODEL_SCALE_MOBILE below
// RAMP_START_PX, MODEL_SCALE_DESKTOP above RAMP_END_PX, smoothly
// interpolated in between — no hard mobile/desktop switch. Desktop widths
// (>=1400px) get exactly the original scale (0.42), unchanged; small
// phones get ~14% smaller, so Piri supports the now-larger logo instead of
// dominating it.
export const MODEL_SCALE_DESKTOP = 0.42;
export const MODEL_SCALE_MOBILE = MODEL_SCALE_DESKTOP * 0.86;
const MODEL_SCALE_RAMP_START_PX = 375;
const MODEL_SCALE_RAMP_END_PX = 1400;

export function getModelScale(viewportWidthPx: number) {
  const t = (viewportWidthPx - MODEL_SCALE_RAMP_START_PX) / (MODEL_SCALE_RAMP_END_PX - MODEL_SCALE_RAMP_START_PX);
  const clamped = Math.min(1, Math.max(0, t));
  return MODEL_SCALE_MOBILE + (MODEL_SCALE_DESKTOP - MODEL_SCALE_MOBILE) * clamped;
}

// Vertical bands, top to bottom, as fractions of the logo image height —
// measured via scripts/measure-logo-layout.mjs. Used to time the reveal so
// it naturally lands as icon, then wordmark, then studio+lines.
export const LOGO_BANDS = {
  icon: { top: 0.169, bottom: 0.594 },
  wordmark: { top: 0.652, bottom: 0.72 },
  studio: { top: 0.756, bottom: 0.78 },
};

// How far above the logo's top edge Piri hovers, as a fraction of the
// viewport height ("15-20% above the future logo").
const HOVER_GAP_FRAC = 0.18;

// Piri's resting hover point, in viewport fractions (0..1, top-left origin).
// This governs body placement ONLY — the light beam does not anchor here;
// it tracks the abdomen's actual projected screen position every frame (see
// introState.abdomenXFrac/abdomenYFrac), since bobbing/sway/orientation
// constantly move the abdomen relative to this resting point.
export function getHoverTargetFrac(viewportWidthPx: number, viewportHeightPx: number) {
  const logoHeightFrac = getLogoHeightPx(viewportWidthPx) / viewportHeightPx;
  const logoTopFrac = 0.5 - logoHeightFrac / 2;
  return {
    xFrac: 0.5,
    yFrac: logoTopFrac - HOVER_GAP_FRAC,
  };
}
