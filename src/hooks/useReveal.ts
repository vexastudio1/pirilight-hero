import { useEffect, useRef, useState } from 'react';

// Single shared "emerge from darkness" primitive used by every section below
// the hero (see components/ui/Reveal.tsx) instead of each section rolling
// its own IntersectionObserver. Fires once per element, then disconnects —
// this is a one-shot reveal-on-enter, not a continuous scroll-scrubbed
// value, which keeps every section's motion cheap and predictable instead
// of adding N more rAF loops on top of the hero's own scroll system.
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
