// A plain mutable object, not React state, bridging the r3f render loop
// (PiriModel, inside the WebGL canvas) and the DOM overlay's own rAF loop
// (IntroOverlay, AmbientParticles). PiriModel is the single source of truth
// for "elapsed seconds since the sequence started" and for the abdomen's
// projected screen position — both are written once per r3f frame and read
// by the DOM layers each of their own frames, instead of keeping a second,
// potentially-drifting clock/position. Mutating a plain object avoids
// triggering React re-renders on every animation frame.
export interface IntroState {
  elapsed: number;
  resetSignal: number;
  /** Abdomen anchor projected to viewport fractions (0..1, top-left origin). */
  abdomenXFrac: number;
  abdomenYFrac: number;
}

export const introState: IntroState = {
  elapsed: 0,
  resetSignal: 0,
  abdomenXFrac: 0.5,
  abdomenYFrac: 0.5,
};
