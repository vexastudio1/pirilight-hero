import { useEffect, useRef } from 'react';
import { introState } from '../../lib/introState';
import { getBeamOpacity } from '../../lib/introTimeline';
import { scrollState } from '../../lib/scrollState';
import { getAmbientScrollFactor } from '../../lib/scrollTimeline';

// A small, separate layer of soft floating dust particles across the whole
// hero ("very small floating particles move subtly throughout the entire
// scene"). Deliberately independent of NightSky (which stays untouched) and
// of the beam's own decorative particles (which stay local to the cone).
// Kept intentionally sparse and slow — premium, not a noisy particle cloud.

interface Particle {
  xFrac: number;
  yFrac: number;
  vx: number;
  vy: number;
  wobblePhase: number;
  wobbleSpeed: number;
  radius: number;
  baseAlpha: number;
}

const PARTICLE_COUNT_DESKTOP = 26;
const PARTICLE_COUNT_MOBILE = 14;

// Rough geometric approximation of the beam's cone (widening downward from
// the abdomen anchor) used only to decide which particles sit "inside" it
// for a subtle brightness boost — doesn't need to match the DOM beam's CSS
// pixel-for-pixel, just close enough to sell the illusion.
const BEAM_HALF_WIDTH_TOP = 0.015;
const BEAM_HALF_WIDTH_BOTTOM = 0.13;
const BEAM_LENGTH_FRAC = 0.5;

function makeParticle(): Particle {
  return {
    xFrac: Math.random(),
    yFrac: Math.random(),
    vx: (Math.random() - 0.5) * 0.006,
    vy: -0.004 - Math.random() * 0.006,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.15 + Math.random() * 0.2,
    radius: 0.6 + Math.random() * 1.2,
    baseAlpha: 0.06 + Math.random() * 0.16,
  };
}

function buildSprite(dpr: number) {
  const size = Math.max(2, Math.round(6 * dpr));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const r = size / 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(220,236,255,0.7)');
  gradient.addColorStop(1, 'rgba(210,228,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export default function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let sprite = buildSprite(dpr);

    const count = width < 640 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    const particles = Array.from({ length: count }, makeParticle);

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sprite = buildSprite(dpr);
    }
    resize();

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      if (!ctx || !canvas) {
        raf = requestAnimationFrame(frame);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const beamOpacity = reducedMotion ? 0 : getBeamOpacity(introState.elapsed);
      const anchorX = introState.abdomenXFrac;
      const anchorY = introState.abdomenYFrac;

      // Subtler than any star layer, so it never competes with the
      // starfield's own depth parallax during the scroll transition.
      const { alpha: scrollAlpha, driftVh } = getAmbientScrollFactor(scrollState.masterT);
      const scrollOffsetPx = (driftVh / 100) * canvas.height;
      if (scrollAlpha <= 0.001) {
        raf = requestAnimationFrame(frame);
        return;
      }

      for (const p of particles) {
        if (!reducedMotion) {
          p.xFrac += p.vx * dt + Math.sin(now * 0.0002 + p.wobblePhase) * 0.0004;
          p.yFrac += p.vy * dt;
          p.wobblePhase += p.wobbleSpeed * dt;

          if (p.yFrac < -0.05) p.yFrac = 1.05;
          if (p.xFrac < -0.05) p.xFrac = 1.05;
          if (p.xFrac > 1.05) p.xFrac = -0.05;
        }

        let boost = 0;
        if (beamOpacity > 0.01) {
          const dy = p.yFrac - anchorY;
          if (dy > 0 && dy < BEAM_LENGTH_FRAC) {
            const spread = dy / BEAM_LENGTH_FRAC;
            const halfWidth = BEAM_HALF_WIDTH_TOP + (BEAM_HALF_WIDTH_BOTTOM - BEAM_HALF_WIDTH_TOP) * spread;
            const dx = Math.abs(p.xFrac - anchorX);
            if (dx < halfWidth) {
              boost = (1 - dx / halfWidth) * beamOpacity;
            }
          }
        }

        const alpha = Math.min(1, p.baseAlpha + boost * 0.55) * scrollAlpha;
        if (alpha <= 0.01) continue;
        const size = sprite.width * (1 + boost * 0.6);
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          sprite,
          p.xFrac * canvas.width - size / 2,
          p.yFrac * canvas.height - scrollOffsetPx - size / 2,
          size,
          size,
        );
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero__ambient" aria-hidden="true" />;
}
