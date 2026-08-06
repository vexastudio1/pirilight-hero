import { useEffect, useState } from 'react';

// Small, generic media-query hook — used to gate mobile-only behavior (e.g.
// Header's hero-visibility logic) without duplicating a breakpoint number
// that already lives in global.css as a literal `@media` query. `query`
// should match that literal breakpoint exactly (860px, same as the
// `.site-header__nav`/`.site-header__toggle` switch) so JS and CSS agree on
// what "mobile" means.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
