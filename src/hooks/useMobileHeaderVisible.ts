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
// geometry-based; this hook now matches that same shape for mobile, just
// with a different (non-innerHeight-dependent) threshold — see below.
//
// The single source of truth here is the OUTER hero scroll section itself
// — `#inicio` / `.hero-transition-region` (Hero.tsx), which spans the
// sticky 100vh hero PLUS its dedicated scroll-drift buffer (`--hero-drift-vh`)
// — i.e. the full scroll distance before `.problem-section` ("A Nossa
// Missão" 's predecessor) genuinely takes over. Checking THIS element's own
// `getBoundingClientRect().bottom` (not window.innerHeight, not the 3D
// canvas, not the logo, not any inner sticky child) against a fixed 0
// answers exactly one question, unaffected by animation timing, scroll
// velocity, or scroll direction: has the user physically scrolled past the
// complete hero section? `bottom <= 0` means every pixel of that section —
// including its drift buffer — is now above the viewport; `bottom > 0`
// means at least some of it is still on screen, so the header stays
// hidden. Flipping back to hidden when the user scrolls back up into the
// hero is a direct consequence of the same inequality, not a separate
// direction check.
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
      const next = heroBottom <= 0;
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
