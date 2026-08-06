// Mirrors introState.ts / scrollState.ts: a plain mutable object, not React
// state, bridging PiriFlybyScene's own r3f render loop and NightSky's
// independent Canvas2D draw loop — so the starfield can react to Piri's
// live position during the Mission->Services flyby moment without either
// component re-rendering or subscribing to the other.
export interface FlybyState {
  active: boolean;
  /** Piri's current position, projected to WINDOW-relative fractions (0..1) — comparable to NightSky's own star coordinates, even though the flyby's own <Canvas> is a small element partway down the page, not full-viewport. */
  xFrac: number;
  yFrac: number;
  /** 0..1 — how "on" the reaction should read; mirrors the trail's own intensity envelope. */
  intensity: number;
}

export const flybyState: FlybyState = {
  active: false,
  xFrac: 0.5,
  yFrac: 0.5,
  intensity: 0,
};
