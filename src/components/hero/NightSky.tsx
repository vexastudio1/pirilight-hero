import { useEffect, useRef } from 'react';
import { scrollState } from '../../lib/scrollState';
import { getSkyBrightnessFactor, getStarLayerScrollFactor, type StarLayerName } from '../../lib/scrollTimeline';

// A fully self-contained, canvas-based starfield. It knows nothing about Piri,
// the logo, or the flight animation — it only paints a still, breathing night
// sky behind whatever is layered on top of it. Safe to drop into any section.

interface StarLayer {
  stars: Star[];
  driftPxPerSec: number;
  offsetX: number;
}

interface Star {
  xFrac: number; // 0..1 across the field, resolved to pixels at draw time
  yFrac: number;
  radius: number;
  peakAlpha: number;
  minAlpha: number;
  period: number; // seconds for one full brighten/fade/wait cycle
  phase: number; // seconds, randomizes where in the cycle each star starts
  pulseWidth: number; // fraction of `period` spent actually brightening+fading
  spriteBucket: number; // index into the shared sprite atlas
}

const SPRITE_SIZES = [3, 5, 8, 20]; // device-pixel diameters of the glow sprites (last = rare bloom)
const CENTER_ELLIPSE = { rx: 0.24, ry: 0.3, keepChance: 0.35 }; // fraction of viewport kept relatively clear
const EASTER_EGG_CYCLE = 10; // seconds between chase sequences
const EASTER_EGG_PULSE = 1.35; // seconds each star takes to brighten+fade
const EASTER_EGG_STEP = 0.68; // seconds between each star's pulse starting

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inCenterEllipse(xFrac: number, yFrac: number) {
  const dx = (xFrac - 0.5) / CENTER_ELLIPSE.rx;
  const dy = (yFrac - 0.5) / CENTER_ELLIPSE.ry;
  return dx * dx + dy * dy < 1;
}

function pickSpriteBucket(radius: number, bloom: boolean) {
  if (bloom) return SPRITE_SIZES.length - 1;
  if (radius < 0.55) return 0;
  if (radius < 0.85) return 1;
  return 2;
}

function makeStar(rand: () => number, isEasterEgg = false): Star {
  let xFrac = 0;
  let yFrac = 0;
  do {
    xFrac = rand();
    yFrac = rand();
  } while (!isEasterEgg && inCenterEllipse(xFrac, yFrac) && rand() > CENTER_ELLIPSE.keepChance);

  const sizeRoll = Math.pow(rand(), 3);
  const radius = 0.35 + sizeRoll * 1.1;
  // Slightly more generous than before (0.992 -> 0.986) so a few more stars
  // get the soft-glowing "bloom" treatment — still rare, just not vanishingly
  // so, per "allow only a small number of stars to occasionally become
  // noticeably brighter."
  const bloom = !isEasterEgg && rand() > 0.986;
  const finalRadius = bloom ? radius + 1.6 : radius;

  // Heavily skewed toward dim: most stars stay faint, a handful read clearly,
  // and only the rare "bloom" star gets a real, soft-glowing presence. The
  // floor is nudged up slightly (0.08 -> 0.1) so even the dimmest stars read
  // as faintly present rather than disappearing against the sky.
  const brightnessRoll = Math.pow(rand(), 2.4);

  return {
    xFrac,
    yFrac,
    radius: finalRadius,
    peakAlpha: bloom ? 0.85 + rand() * 0.1 : 0.1 + brightnessRoll * 0.55,
    minAlpha: bloom ? 0.12 : Math.pow(rand(), 3) * 0.05,
    period: 5 + rand() * 16,
    phase: rand() * 24,
    pulseWidth: 0.14 + rand() * 0.16,
    spriteBucket: pickSpriteBucket(finalRadius, bloom),
  };
}

// Moderate increase over the previous counts (roughly +35-45%) for a fuller
// sky without tipping into a dense galaxy — still scaled down on narrow
// viewports so weaker/smaller devices paint fewer sprites per frame.
function starCountsForWidth(width: number) {
  if (width < 600) return { background: 220, middle: 120, foreground: 55 };
  if (width < 1024) return { background: 400, middle: 210, foreground: 105 };
  return { background: 620, middle: 320, foreground: 160 };
}

// Smooth 0 -> 1 -> 0 hump occupying the first `pulseWidth` fraction of the
// cycle; the star idles at `minAlpha` for the remainder ("wait").
function twinkle(star: Star, t: number) {
  const cycle = ((t + star.phase) % star.period) / star.period;
  if (cycle >= star.pulseWidth) return star.minAlpha;
  const local = cycle / star.pulseWidth;
  const hump = 0.5 - 0.5 * Math.cos(local * Math.PI * 2);
  return star.minAlpha + (star.peakAlpha - star.minAlpha) * hump;
}

// Under prefers-reduced-motion the sky should still show its natural range
// of star brightness (some dim, some clearly lit) without any pulsing —
// a fixed alpha partway between each star's own min/max, so the field still
// reads as varied rather than flattening every star to the same brightness.
function staticAlpha(star: Star) {
  return star.minAlpha + (star.peakAlpha - star.minAlpha) * 0.55;
}

// The five hidden stars share one clock instead of independent twinkle
// cycles: a slow sequential chase, once per EASTER_EGG_CYCLE seconds.
function easterEggAlpha(index: number, t: number, star: Star) {
  const cycle = t % EASTER_EGG_CYCLE;
  const start = index * EASTER_EGG_STEP;
  const local = cycle - start;
  if (local < 0 || local > EASTER_EGG_PULSE) return star.minAlpha;
  const p = local / EASTER_EGG_PULSE;
  const hump = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
  return star.minAlpha + (star.peakAlpha - star.minAlpha) * hump;
}

function buildSprites(dpr: number) {
  const bloomIndex = SPRITE_SIZES.length - 1;
  return SPRITE_SIZES.map((size, i) => {
    const d = Math.max(2, Math.round(size * dpr));
    const canvas = document.createElement('canvas');
    canvas.width = d;
    canvas.height = d;
    const ctx = canvas.getContext('2d')!;
    const r = d / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    if (i === bloomIndex) {
      // The rare "beautiful soft bloom" star: a wide, dreamy falloff.
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.22, 'rgba(235,244,255,0.85)');
      gradient.addColorStop(0.55, 'rgba(210,228,255,0.22)');
      gradient.addColorStop(1, 'rgba(210,228,255,0)');
    } else {
      // Ordinary stars: a tight, near-pinpoint core with minimal spread so
      // they read as tiny points of light rather than soft blobs.
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.4, 'rgba(240,246,255,0.7)');
      gradient.addColorStop(0.75, 'rgba(220,232,255,0.08)');
      gradient.addColorStop(1, 'rgba(220,232,255,0)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, d, d);
    return canvas;
  });
}

export default function NightSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = mulberry32(0x50152a);

    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let sprites = buildSprites(dpr);

    const counts = starCountsForWidth(width);
    const layers: Record<'background' | 'middle' | 'foreground', StarLayer> = {
      background: { stars: Array.from({ length: counts.background }, () => makeStar(rand)), driftPxPerSec: reducedMotion ? 0 : 1.1, offsetX: 0 },
      middle: { stars: Array.from({ length: counts.middle }, () => makeStar(rand)), driftPxPerSec: reducedMotion ? 0 : 2.4, offsetX: 0 },
      foreground: { stars: Array.from({ length: counts.foreground }, () => makeStar(rand)), driftPxPerSec: reducedMotion ? 0 : 4.2, offsetX: 0 },
    };

    // Five stars, quietly aligned in a straight line, tucked into a corner.
    const eggY = 0.09 + rand() * 0.03;
    const eggStartX = 0.72 + rand() * 0.06;
    const eggSpacing = 0.028;
    const easterEgg: Star[] = Array.from({ length: 5 }, (_, i) => {
      const star = makeStar(rand, true);
      star.xFrac = eggStartX + i * eggSpacing;
      star.yFrac = eggY;
      star.radius = 0.55 + rand() * 0.25;
      star.peakAlpha = 0.5 + rand() * 0.15;
      star.minAlpha = 0.05 + rand() * 0.05;
      star.spriteBucket = 1;
      return star;
    });

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sprites = buildSprites(dpr);
    }
    resize();

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let start = performance.now();

    // Base night-sky tones, and how far each one is allowed to lift toward
    // as the whole page scrolls (see SKY_BASE_TOP/MID/BOTTOM below) — kept
    // small and still very dark, so the sky reads as "darkness slowly being
    // illuminated," never as a plain blue background. Top lifts the most
    // (that's where the atmospheric blobs sit), bottom barely moves so the
    // vignette depth is preserved even at the brightest point of the page.
    const SKY_TOP = { from: [7, 12, 24], to: [17, 27, 50] };
    const SKY_MID = { from: [3, 6, 15], to: [10, 16, 34] };
    const SKY_BOTTOM = { from: [1, 3, 10], to: [5, 9, 24] };

    function lerpChannel(from: number[], to: number[], t: number) {
      const r = Math.round(from[0] + (to[0] - from[0]) * t);
      const g = Math.round(from[1] + (to[1] - from[1]) * t);
      const b = Math.round(from[2] + (to[2] - from[2]) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }

    function drawSky() {
      if (!ctx) return;
      const w = canvas!.width;
      const h = canvas!.height;
      const t = scrollState.pageT;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, lerpChannel(SKY_TOP.from, SKY_TOP.to, t));
      gradient.addColorStop(0.55, lerpChannel(SKY_MID.from, SKY_MID.to, t));
      gradient.addColorStop(1, lerpChannel(SKY_BOTTOM.from, SKY_BOTTOM.to, t));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    function drawLayer(layer: StarLayer, layerName: StarLayerName, t: number, dt: number) {
      if (!ctx) return;
      layer.offsetX = (layer.offsetX + layer.driftPxPerSec * dt) % width;
      const py = height * dpr;
      // The starfield is the persistent night environment, not something
      // that scrolls away — this only applies a small per-layer dim/drift
      // for depth (background stays essentially untouched, foreground dims
      // somewhat) plus a subtle uniform brightness nudge as the transition
      // progresses (see scrollTimeline.ts). Computed once per layer per
      // frame, not per star.
      const { alpha: scrollAlpha, driftVh } = getStarLayerScrollFactor(layerName, scrollState.masterT);
      const brightness = getSkyBrightnessFactor(scrollState.masterT);
      if (scrollAlpha <= 0.001) return;
      const scrollOffsetPx = (driftVh / 100) * py;
      for (const star of layer.stars) {
        const base = reducedMotion ? staticAlpha(star) : twinkle(star, t);
        const alpha = Math.min(1, base * scrollAlpha * brightness);
        if (alpha <= 0.01) continue;
        const x = (((star.xFrac * width - layer.offsetX) % width) + width) % width;
        const sprite = sprites[star.spriteBucket];
        const size = sprite.width;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, x * dpr - size / 2, star.yFrac * py - scrollOffsetPx - size / 2, size, size);
      }
    }

    function drawEasterEgg(t: number) {
      if (!ctx) return;
      const py = height * dpr;
      easterEgg.forEach((star, i) => {
        const alpha = reducedMotion ? staticAlpha(star) : easterEggAlpha(i, t, star);
        if (alpha <= 0.01) return;
        const sprite = sprites[star.spriteBucket];
        const size = sprite.width;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, star.xFrac * width * dpr - size / 2, star.yFrac * py - size / 2, size, size);
      });
    }

    let last = start;
    function frame(now: number) {
      const t = (now - start) / 1000;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      drawSky();
      drawLayer(layers.background, 'background', t, dt);
      drawLayer(layers.middle, 'middle', t, dt);
      drawLayer(layers.foreground, 'foreground', t, dt);
      drawEasterEgg(t);
      ctx!.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero__sky" aria-hidden="true" />;
}
