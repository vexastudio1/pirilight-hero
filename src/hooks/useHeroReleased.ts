import { useEffect, useState } from 'react';

// The hero (`#inicio`, i.e. `.hero-transition-region`) is `position: sticky`
// for its own 100vh PLUS a dedicated scroll-drift distance (see
// useScrollDrift.ts and the `.hero-transition-region`/`.hero` rules in
// global.css) — it visually occupies the full screen for that entire scroll
// range, not just its first 100vh.
//
// An earlier version of this hook compared the *Problem section's* position
// to the viewport instead. That was wrong: `.problem-section` has a negative
// `margin-top` (equal to the hero's drift distance) so it can rise up under
// the still-pinned hero as part of the scroll transition — which means its
// document position sits barely one viewport-height down from the very top
// of the page. A check like `problemTop <= viewportHeight` was satisfied
// almost immediately on load, while the hero (and Piri) were still fully
// on screen.
//
// The correct, robust signal is the hero-transition-region's OWN bottom
// edge. With `position: sticky; top: 0`, the pinned `.hero` only releases
// once the region's remaining height can no longer hold it at the top of
// the viewport — i.e. once `region.bottom <= window.innerHeight`. That's
// true by construction: the region's extra scroll room (`--hero-drift-vh`)
// is defined as exactly (region height − viewport height), so this
// condition becomes true at precisely the moment the sticky hero releases,
// regardless of how fast or slow the user scrolls, or how long Piri's own
// intro timeline takes.
//
// That threshold sits in the *middle* of the region's intersection
// lifetime (it stays "intersecting" the viewport for the whole scroll
// range), not at an enter/exit boundary — so a plain IntersectionObserver
// won't fire a callback anywhere near it. This needs the same continuous
// per-frame check useScrollDrift.ts already uses for the same reason;
// reusing that pattern here instead of forcing an observer to do something
// it isn't suited for. Cost is one getBoundingClientRect() + one comparison
// per frame, and only calls setState when the boolean actually flips.
// `routeKey` (e.g. the current pathname) is an extra effect dependency, not
// used for anything else here. Header is mounted once at the App root and
// never unmounts across route changes, so without this the very first
// lookup of `regionId` "sticks" for the component's whole lifetime — on a
// route with no hero (any page other than home) `region` is null forever,
// and the header stays permanently hidden even after navigating back to a
// page that does have one. Passing the pathname forces the lookup to redo
// itself on every route change instead.
export function useHeroReleased(regionId: string, routeKey?: unknown) {
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const region = document.getElementById(regionId);
    if (!region) {
      // No hero on this page (project/case-study pages, the enquiry page,
      // …) — nothing to wait for, so the header should just be visible.
      setReleased(true);
      return;
    }

    let raf = 0;
    let last: boolean | null = null;

    function tick() {
      const isReleased = region!.getBoundingClientRect().bottom <= window.innerHeight;
      if (isReleased !== last) {
        last = isReleased;
        setReleased(isReleased);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [regionId, routeKey]);

  return released;
}
