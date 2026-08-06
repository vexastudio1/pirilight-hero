import { NAV_LINKS } from '../../data/navigation';
import { useRouter } from '../../lib/router';

export default function Footer() {
  // See Header.tsx for why section anchors need the "/" prefix off the home page.
  const { pathname } = useRouter();
  const homePrefix = pathname === '/' ? '' : '/';

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__logo">PiriLight Studio</p>
          <p className="site-footer__slogan">Não criamos apenas websites. Iluminamos negócios.</p>
        </div>

        <nav className="site-footer__nav" aria-label="Navegação do rodapé">
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={`${homePrefix}#${link.id}`} className="site-footer__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-footer__contact">
          <a href="mailto:ola@pirilight.pt" className="site-footer__link">
            ola@pirilight.pt
          </a>
          <a href="#" className="site-footer__link">
            Instagram
          </a>
          <a href="#" className="site-footer__link">
            LinkedIn
          </a>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>&copy; 2026 PiriLight Studio. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
