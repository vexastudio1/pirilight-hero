import { useEffect, useState } from 'react';

// Mobile-only header-visibility rule. Deliberately has NO dependency on the
// hero's cinematic intro (introState.elapsed / isSequenceComplete) — an
// earlier version tied visibility to "intro animation complete", but that's
// a wall-clock timer (~15.45s) completely independent of how fast the user
// actually scrolls. A user who scrolls straight through the hero in a few
// seconds reaches "A Nossa Missão" long before that timer elapses, and the
// header stayed hidden until the clock caught up — reading as "the header
// never appears" even though the user is well past the hero. Desktop's
// useHeroReleased never had this problem since it was already purely
// geometry-based; this hook now matches that same shape for mobile.
//
// The single source of truth here is the OUTER hero scroll section itself
// — `#inicio` / `.hero-transition-region` (Hero.tsx), which spans the
// sticky 100vh hero PLUS its dedicated scroll-drift buffer (`--hero-drift-vh`,
// 40vh on mobile — see global.css). `.hero` is `position: sticky; top: 0`
// against that region, so it only unsticks and starts scrolling away —
// i.e. the exact moment the Problem section starts rising up underneath it
// — once the region's own remaining height can no longer hold it at the
// top of the viewport: `region.bottom <= window.innerHeight`. That's the
// real Hero -> Problem boundary, true by construction regardless of screen
// height, and it's the SAME condition useHeroReleased already uses for
// desktop (see that hook for the full derivation).
//
// This used to check `heroBottom <= 0` instead — the region's bottom
// reaching the very TOP of the viewport, not the bottom. Since the region
// is 100vh + 40vh = 140vh tall, that condition only becomes true after the
// user scrolls a full extra viewport-height PAST the point where the hero
// actually releases and the Problem section becomes visible — the header
// stayed hidden for an entire screen's worth of the Problem section before
// appearing. `<= window.innerHeight` matches desktop exactly and fires
// right at the Hero/Problem seam instead.
export function useMobileHeaderVisible(routeKey?: unknown) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroSection = document.getElementById('inicio');
    if (!heroSection) {
      // No hero on this route (project/case-study pages, the enquiry page,
      // …) — nothing to be "past", header should just be visible.
      setVisible(true);
      return;
    }

    let raf = 0;
    let last: boolean | null = null;

    function evaluate() {
      const heroBottom = heroSection!.getBoundingClientRect().bottom;
      const next = heroBottom <= window.innerHeight;
      if (next !== last) {
        last = next;
        setVisible(next);
      }
    }

    function tick() {
      evaluate();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // Redundant with the rAF loop above — immediate reaction on top of the
    // continuous per-frame check, not a replacement for it.
    window.addEventListener('scroll', evaluate, { passive: true });
    window.addEventListener('resize', evaluate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', evaluate);
      window.removeEventListener('resize', evaluate);
    };
  }, [routeKey]);

  return visible;
}
