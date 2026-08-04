// Single source of truth for the hero's scroll-driven "night lifted away"
// transition — the scroll analog of introTimeline.ts. Everything here is a
// pure function of one number (0..1 raw progress through the dedicated
// sticky drift region), so the transform/opacity math never has to be
// duplicated between NightSky's canvas loop, AmbientParticles' canvas loop,
// and the DOM subject-drift wrapper.

import { clamp01, easeInCubic, easeInOutSine } from './introTimeline';

// ---- Master progress shaping ----------------------------------------------
//
// Per creative direction: a brief hold before anything moves, a controlled
// develop phase, then an accelerating finish as the next section takes over.
// Continuous at both boundaries (0 at HOLD_END, MASTER_T_AT_DEVELOP_END at
// DEVELOP_END, 1 at raw=1) so there's no visible jump between phases.
export const HOLD_END = 0.08;
export const DEVELOP_END = 0.65;
const MASTER_T_AT_DEVELOP_END = 0.7;

export function getScrollMasterT(raw: number): number {
  const r = clamp01(raw);
  if (r < HOLD_END) return 0;
  if (r < DEVELOP_END) {
    const local = (r - HOLD_END) / (DEVELOP_END - HOLD_END);
    return easeInOutSine(local) * MASTER_T_AT_DEVELOP_END;
  }
  const local = (r - DEVELOP_END) / (1 - DEVELOP_END);
  return MASTER_T_AT_DEVELOP_END + easeInCubic(local) * (1 - MASTER_T_AT_DEVELOP_END);
}

// ---- Subject group (logo + beam + 3D canvas) -------------------------------
//
// Travel distance is read from CSS (`--subject-drift-distance`, responsive
// via media query in global.css) so the DOM wrapper's transform can be pure
// CSS (`calc(var(--scroll-drift-t) * -1 * var(--subject-drift-distance))`);
// masterT itself drives both that transform and its opacity together, so the
// two are always in lockstep by construction. Exported for reference/testing
// even though the multiplier used in CSS is just `1 - t`.
export function getSubjectOpacity(masterT: number): number {
  return 1 - clamp01(masterT);
}

// Maximum fraction the subject group shrinks by at masterT = 1 — subtle,
// just enough to read as "receding" alongside the upward drift and fade.
export const SUBJECT_MAX_SHRINK = 0.08;

// ---- Star layer depth (NightSky) -------------------------------------------
//
// The starfield is the persistent night environment, not part of what
// scrolls away — only foreground stars dim/drift *somewhat* for a subtle
// depth cue as the subject group departs; nothing ever fades below its
// floor, and background/middle stay effectively where they always were.
// `driftVh` stays small and is scaled by (1 - floor) so a layer that barely
// dims also barely moves — a layer that's mostly staying put shouldn't
// visibly travel either.
export const STAR_LAYER_DRIFT = {
  background: { floor: 1.0, driftVh: 1.5 },
  middle: { floor: 0.85, driftVh: 3 },
  foreground: { floor: 0.55, driftVh: 6 },
} as const;

export type StarLayerName = keyof typeof STAR_LAYER_DRIFT;

export function getStarLayerScrollFactor(layer: StarLayerName, masterT: number) {
  const { floor, driftVh } = STAR_LAYER_DRIFT[layer];
  const t = clamp01(masterT);
  const alpha = 1 - (1 - floor) * t;
  return { alpha, driftVh: driftVh * (1 - floor) * t };
}

// A small, capped brightness nudge (alpha only — never size, never star
// count) applied uniformly across all layers as the transition progresses,
// supporting "darkness -> first points of light -> increasing visibility"
// without ever reading as stars suddenly popping in or growing.
const SKY_BRIGHTNESS_MAX_BOOST = 0.12;

export function getSkyBrightnessFactor(masterT: number): number {
  return 1 + clamp01(masterT) * SKY_BRIGHTNESS_MAX_BOOST;
}

// ---- Tagline lag -------------------------------------------------------
//
// The brand statement should visibly follow the logo rather than move in
// perfect lockstep with it — starts once the logo's own drift is already
// under way (masterT > TAGLINE_LAG), then runs to completion over the
// remaining range. Applied purely in CSS (`--tagline-t` on
// `.hero__tagline-drift` in global.css, which duplicates this 0.15 value —
// keep both in sync) since it's a static function of the same
// `--scroll-drift-t` custom property already being written every frame;
// exported here only as the documented single source of truth for that
// number.
export const TAGLINE_LAG = 0.15;

// ---- Ambient dust particles -------------------------------------------------
//
// A single subtle layer, deliberately smaller drift and an earlier-ish fade
// than any star layer so it never competes with the starfield for attention.
export const AMBIENT_DRIFT = { fadeEnd: 0.9, driftVh: 2 };

export function getAmbientScrollFactor(masterT: number) {
  const t = clamp01(masterT);
  const alpha = clamp01(1 - t / AMBIENT_DRIFT.fadeEnd);
  return { alpha, driftVh: AMBIENT_DRIFT.driftVh * t };
}
