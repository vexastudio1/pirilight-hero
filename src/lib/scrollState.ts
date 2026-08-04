// Mirrors introState.ts: a plain mutable object bridging the scroll-driven
// drift's own rAF loop (useScrollDrift, running in Hero.tsx) and the Canvas2D
// draw loops (NightSky, AmbientParticles) that need the same progress value
// without subscribing to React state or re-rendering on every scroll frame.
export interface ScrollDriftState {
  /** Raw linear 0..1 progress through the hero's dedicated drift scroll room. */
  raw: number;
  /** Eased hold -> develop -> accelerate progress derived from `raw` (see scrollTimeline.ts). */
  masterT: number;
  /**
   * Whole-document scroll progress, 0 at the very top to 1 at the very
   * bottom — independent of `raw`/`masterT` (which only cover the hero's own
   * short drift region). Drives the global "darkness slowly lit" system:
   * NightSky's base sky tint and the GlobalLightField blobs in global.css
   * (mirrored there as the `--page-light-t` custom property on
   * `<html>`, written by useScrollDrift). Canvas2D layers read this field
   * directly since they can't consume a CSS variable.
   */
  pageT: number;
}

export const scrollState: ScrollDriftState = {
  raw: 0,
  masterT: 0,
  pageT: 0,
};
