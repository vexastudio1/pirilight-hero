import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
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
