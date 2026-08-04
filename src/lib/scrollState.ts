// Mirrors introState.ts: a plain mutable object bridging the scroll-driven
// drift's own rAF loop (useScrollDrift, running in Hero.tsx) and the Canvas2D
// draw loops (NightSky, AmbientParticles) that need the same progress value
// without subscribing to React state or re-rendering on every scroll frame.
export interface ScrollDriftState {
  /** Raw linear 0..1 progress through the hero's dedicated drift scroll room. */
  raw: number;
  /** Eased hold -> develop -> accelerate progress derived from `raw` (see scrollTimeline.ts). */
  masterT: number;
}

export const scrollState: ScrollDriftState = {
  raw: 0,
  masterT: 0,
};
