import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';

// Minimal client-side router — no external dependency. The site has exactly
// two "kinds" of page (the long-scroll home page and a handful of project
// case-study pages), so a full router library would be more machinery than
// the problem needs. This just tracks `location.pathname` in React state and
// updates it via the History API so navigation doesn't reload the page (and
// doesn't restart the hero's one-shot intro animation every time someone
// visits a project and comes back).
interface RouterContextValue {
  pathname: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Browsers restore the previous scroll offset on `popstate` by default
  // (`history.scrollRestoration === 'auto'`) — fine for the pages it was
  // designed for, but here it fights the "every route always starts at the
  // top" rule below: Back could re-open a project page part-scrolled, or
  // race the reset effect. `'manual'` hands scroll position fully to this
  // router, which is exactly what the effect below then provides,
  // consistently, for every navigation including Back/Forward.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  // The single, centralized "new route starts at the top" reset — covers
  // every pathname change regardless of HOW it happened (a `<Link>` click
  // below, the browser's own Back/Forward, or any future navigation path),
  // so individual pages never need their own `window.scrollTo(0, 0)`.
  //
  // `useLayoutEffect`, not `useEffect`: it runs synchronously right after
  // the new page's DOM has been committed but before the browser paints,
  // so the reset lands before anything is visible — no bottom-of-page frame
  // flashing before snapping to the top.
  //
  // The extra `requestAnimationFrame` follow-up guards against mobile
  // Safari/Chrome's touch-momentum scrolling: tapping a `<Link>` while the
  // previous flick-scroll is still decelerating can leave an inertial
  // scroll animation running that keeps moving `scrollY` for a few more
  // frames — including AFTER this effect's own synchronous reset — and
  // since the new page is typically much shorter than the one the user was
  // just on, that leftover momentum can drag the new page most of the way
  // to ITS bottom. Re-asserting one frame later reliably wins that race
  // without adding a visible delay.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  const navigate = useCallback((to: string) => {
    const [path] = to.split('#');
    if (path && path !== window.location.pathname) {
      window.history.pushState({}, '', to);
      setPathname(path);
    } else if (!path) {
      // Hash-only navigation on the same page — let the browser handle the
      // in-page scroll, nothing for the router to do.
      window.location.hash = to;
      return;
    }
    // Handles the one case the effect above can't: navigating to the SAME
    // pathname (e.g. the header brand link while already on "/"). No
    // pathname change means the effect's dependency never fires, so this
    // stays as the direct reset for that specific case.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return <RouterContext.Provider value={{ pathname, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within a RouterProvider');
  return ctx;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
}

// Drop-in replacement for <a> that intercepts plain left-clicks to route
// in-app (no reload), while leaving modifier-clicks, middle-clicks and
// right-clicks to the browser's native "open in new tab" behavior.
// forwardRef so callers like Reveal (which attaches an IntersectionObserver
// ref directly to whatever `as` renders) can target the real <a> element.
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, children, onClick, ...rest },
  ref,
) {
  const { navigate } = useRouter();

  return (
    <a
      ref={ref}
      href={to}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
});
