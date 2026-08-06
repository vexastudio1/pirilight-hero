import { useRef } from 'react';

// Mobile performance pass: this used to gate every section's text/heading/
// card content behind an IntersectionObserver + opacity:0-until-visible
// state (one observer instance per <Reveal>, scattered across every
// section on the page). That's real, avoidable cost on low-end mobile —
// dozens of observers doing scroll-driven layout work for what is, in the
// end, plain static text — and it meant ordinary content stayed invisible
// until JS had run and scrolled it into view instead of rendering
// immediately. Content should never be hidden waiting on script.
//
// Kept as a hook (same name/shape, still returns `ref` + `visible`) purely
// so components/ui/Reveal.tsx and every call site that passes a `threshold`
// prop don't need touching — `visible` is now always `true` from the first
// render, so `.reveal--visible` applies immediately and `.reveal`'s
// opacity:0 base state (see global.css) is never the state anything is
// actually painted in.
export function useReveal<T extends HTMLElement>(_threshold = 0.2) {
  const ref = useRef<T>(null);
  return { ref, visible: true };
}
