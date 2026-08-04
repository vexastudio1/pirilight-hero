import { useEffect } from 'react';
import type { RefObject } from 'react';
import { scrollState } from '../lib/scrollState';
import { getScrollMasterT } from '../lib/scrollTimeline';

function reducedMotionQuery() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Drives the scroll-triggered "night lifted away" transition. Reads the
// dedicated drift region's own rendered height every frame — driftPx =
// region height minus viewport height — rather than parsing the
// `--hero-drift-vh` CSS value in JS, so the CSS var stays the single source
// of truth for how much scroll room the transition gets. No scroll listener:
// like useIntroFrame, this just samples every rAF tick, which is already how
// every other animation loop in this codebase works and avoids any manual
// dirty-tracking/debouncing.
//
// Writes `--scroll-drift-t` (the eased master progress, 0..1) directly onto
// the region element so CSS custom-property inheritance carries it down to
// `.hero__subject-drift` — no React state, no re-renders. NightSky and
// AmbientParticles read `scrollState.masterT` directly instead, since they're
// Canvas2D and can't consume a CSS variable.
export function useScrollDrift(regionRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;

    const reducedMotion = reducedMotionQuery();
    if (reducedMotion) {
      scrollState.raw = 0;
      scrollState.masterT = 0;
      region.style.setProperty('--scroll-drift-t', '0');
    }

    let raf = 0;

    function tick() {
      // The hero's own short "night lifted away" drift — skipped entirely
      // under reduced motion (see above), since it's a driven parallax/scale
      // animation, not just a response to scroll position.
      if (region && !reducedMotion) {
        const rect = region.getBoundingClientRect();
        const driftPx = Math.max(1, rect.height - window.innerHeight);
        const raw = Math.min(1, Math.max(0, -rect.top / driftPx));
        scrollState.raw = raw;
        const masterT = getScrollMasterT(raw);
        scrollState.masterT = masterT;
        region.style.setProperty('--scroll-drift-t', masterT.toFixed(4));
      }

      // Whole-page scroll progress (0 at top, 1 at bottom) — the single
      // source of truth for the global "darkness slowly lit" system
      // (GlobalLightField's blobs in global.css + NightSky's own base sky
      // tint). Deliberately kept OUTSIDE the reduced-motion branch above:
      // this is a direct, discrete function of the user's own scroll
      // position rather than an autoplaying animation, so the page still
      // brightens as they scroll even with drift/twinkle/parallax disabled.
      // Reuses this same rAF tick rather than a second loop or a `scroll`
      // event listener.
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const pageT = Math.min(1, Math.max(0, window.scrollY / scrollable));
      scrollState.pageT = pageT;
      doc.style.setProperty('--page-light-t', pageT.toFixed(4));

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [regionRef]);
}
