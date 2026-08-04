import { useEffect, useState } from 'react';
import { NAV_CTA_LABEL, NAV_LINKS } from '../../data/navigation';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useHeroReleased } from '../../hooks/useHeroReleased';

const SECTION_IDS = NAV_LINKS.map((link) => link.id);

export default function Header() {
  // The header stays fully hidden for the entire hero experience — including
  // the whole sticky/scroll-drift transition, regardless of Piri's own intro
  // timing — and only reveals once the hero has genuinely released. See
  // useHeroReleased.ts for why this has to key off the hero region's own
  // geometry rather than the Problem section's position. Also gives the
  // reverse behavior for free: scrolling back up re-pins the hero and flips
  // this back to false, hiding the header again.
  const headerVisible = useHeroReleased('inicio');
  const activeId = useActiveSection(SECTION_IDS);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on Escape and lock body scroll while it's open —
  // a small, self-contained concern, not worth a shared hook for one use.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header
      className={`site-header${headerVisible ? ' site-header--visible' : ''}`}
      aria-hidden={!headerVisible}
    >
      <div className="site-header__inner">
        <a
  href="#inicio"
  className="site-header__brand"
  onClick={() => setMenuOpen(false)}
  aria-label="PiriLight Studio"
>
  <img
    src="/pirilight-header-icon.png"
    alt=""
    className="site-header__brand-icon"
  />

  <span className="site-header__brand-piri">PIRI</span>
  <span className="site-header__brand-light">LIGHT</span>
  <span className="site-header__brand-studio">STUDIO</span>
</a>

        <nav className="site-header__nav" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`site-header__link${activeId === link.id ? ' site-header__link--active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#contacto" className="site-header__cta">
          {NAV_CTA_LABEL}
        </a>

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

      {/* Hidden via CSS `visibility: hidden` (not `display: none`) when
          closed, so the close transition can animate — that also removes it
          from the tab order and the accessibility tree natively, without
          needing the `inert` attribute (inconsistent TS/DOM typing support
          at this React version). */}
      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <nav aria-label="Navegação móvel" className="mobile-menu__nav">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="mobile-menu__link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a href="#contacto" className="mobile-menu__cta" onClick={() => setMenuOpen(false)}>
            {NAV_CTA_LABEL}
          </a>
        </nav>
      </div>
    </header>
  );
}
