// Responsive target size for the Mission -> Services flyby's Piri, mirroring
// logoLayout.ts's own "continuous clamp, no breakpoint jumps" convention
// rather than a hard mobile/tablet/desktop switch.
//
// width(px) = clamp(FLOOR, COEFF * vw + BASE, CEILING)
//
// Raised again from the 56-108px pass — with the oversized trail/glow wake
// removed (see PiriFlybyScene.tsx), Piri himself was reading as small and
// hard to recognize against the empty corridor. Now ~64px at a 375px
// phone, ~85px at a 768px tablet, ~120px at 1400px+ desktop, capped at
// 128px so it never dominates on ultrawide monitors or crowds the box's
// own clamped height.
const FLYBY_WIDTH_FLOOR_PX = 64;
const FLYBY_WIDTH_VW_COEFF = 0.052;
const FLYBY_WIDTH_BASE_PX = 45;
const FLYBY_WIDTH_CEILING_PX = 128;

export function getFlybyTargetWidthPx(viewportWidthPx: number): number {
  const preferred = FLYBY_WIDTH_VW_COEFF * viewportWidthPx + FLYBY_WIDTH_BASE_PX;
  return Math.min(FLYBY_WIDTH_CEILING_PX, Math.max(FLYBY_WIDTH_FLOOR_PX, preferred));
}
