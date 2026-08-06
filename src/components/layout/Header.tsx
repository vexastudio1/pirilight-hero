import { useEffect, useState } from 'react';
import { NAV_CTA_LABEL, NAV_LINKS } from '../../data/navigation';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useHeroReleased } from '../../hooks/useHeroReleased';
import { useMobileHeaderVisible } from '../../hooks/useMobileHeaderVisible';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Link, useRouter } from '../../lib/router';

const SECTION_IDS = NAV_LINKS.map((link) => link.id);

// Same breakpoint as `.site-header__nav`/`.site-header__toggle` in
// global.css — kept as a literal here (not read from CSS) since there's no
// existing shared source for it; if the CSS breakpoint ever moves, update
// both.
const MOBILE_BREAKPOINT = '(max-width: 860px)';

export default function Header() {
  // Section anchors (#servicos, #contacto, …) only exist on the home page.
  // From a project case-study page they need to point back at "/" first —
  // a plain cross-page navigation is fine here (it's a rare jump-away
  // action, not part of the in-app project browsing flow the SPA router
  // covers).
  const { pathname } = useRouter();
  const homePrefix = pathname === '/' ? '' : '/';

  // Desktop keeps the exact original geometry-based reveal (unchanged,
  // still what runs when isMobileViewport is false — useHeroReleased itself
  // is untouched). Mobile uses a dedicated hook instead — see
  // useMobileHeaderVisible.ts: it answers a different, simpler question
  // ("has the user physically scrolled past the complete hero section?")
  // with no dependency on window.innerHeight OR on the intro animation's
  // own timing. `pathname` re-triggers both on route change — see the
  // comment on useHeroReleased itself for why that's necessary.
  const isMobileViewport = useMediaQuery(MOBILE_BREAKPOINT);
  const desktopHeaderVisible = useHeroReleased('inicio', pathname);
  const mobileHeaderVisible = useMobileHeaderVisible(pathname);
  const headerVisible = isMobileViewport ? mobileHeaderVisible : desktopHeaderVisible;

  const activeId = useActiveSection(SECTION_IDS);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on Escape, and lock body scroll while it's open.
  // Plain `overflow: hidden` on body doesn't reliably stop background
  // scroll/rubber-banding on iOS Safari — pinning body with `position:
  // fixed` (restoring the exact scroll offset on close) is the standard
  // fix for that.
  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`site-header${headerVisible ? ' site-header--visible' : ''}`}
        aria-hidden={!headerVisible}
      >
        <div className="site-header__inner">
          <a
            href={`${homePrefix}#inicio`}
            className="site-header__brand"
            onClick={() => setMenuOpen(false)}
            aria-label="PiriLight Studio"
          >
            <img src="/pirilight-header-icon.png" alt="" className="site-header__brand-icon" />

            <span className="site-header__brand-piri">PIRI</span>
            <span className="site-header__brand-light">LIGHT</span>
            <span className="site-header__brand-studio">STUDIO</span>
          </a>

          <nav className="site-header__nav" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`${homePrefix}#${link.id}`}
                className={`site-header__link${activeId === link.id ? ' site-header__link--active' : ''}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link to="/comecar-projeto" className="site-header__cta">
            {NAV_CTA_LABEL}
          </Link>

          <button
            type="button"
            className={`site-header__toggle${menuOpen ? ' site-header__toggle--open' : ''}`}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Deliberately a SIBLING of <header>, not a child: `.site-header` has
          its own `transform` (the entrance-animation slide), and a
          `transform` on an ancestor makes it the containing block for any
          `position: fixed` descendant — which silently confined this
          overlay to the header's own small box instead of the full
          viewport (the "cut off in the top-right corner" bug). Living
          outside the transformed header, its `position: fixed; inset: 0`
          resolves against the real viewport as intended.
          Hidden via CSS `visibility: hidden` (not `display: none`) when
          closed, so the close transition can animate — that also removes it
          from the tab order and the accessibility tree natively, without
          needing the `inert` attribute (inconsistent TS/DOM typing support
          at this React version). */}
      <div
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`}
        aria-hidden={!menuOpen}
        onClick={(event) => {
          // Only close on the backdrop itself, not clicks bubbling up from
          // the nav/links inside it (those already close via their own
          // onClick below).
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
      >
        <nav aria-label="Navegação móvel" className="mobile-menu__nav">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`${homePrefix}#${link.id}`}
              className="mobile-menu__link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link to="/comecar-projeto" className="mobile-menu__cta" onClick={() => setMenuOpen(false)}>
            {NAV_CTA_LABEL}
          </Link>
        </nav>
      </div>
    </>
  );
}
