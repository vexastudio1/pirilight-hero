import { Reveal } from '../ui/Reveal';
import { PORTFOLIO_PROJECTS } from '../../data/portfolio';

export default function PortfolioSection() {
  return (
    <section className="section section--portfolio" id="projetos">
      <div className="section__glow" aria-hidden="true" />
      <div className="container">
        <Reveal as="p" className="eyebrow">
          Projetos
        </Reveal>
        <Reveal as="h2" className="section__heading" delay={0.08}>
          Marcas que começaram a ganhar luz.
        </Reveal>
        <Reveal as="p" className="section__body" delay={0.16}>
          Cada projeto nasce de uma realidade diferente, mas todos partilham o mesmo objetivo: criar uma presença
          mais clara, confiante e memorável.
        </Reveal>

        {/* Future hook: Piri may fly toward this list and "reveal" each
            project image in turn — the image-reveal treatment below
            (masked clip + brightness ramp) is already the visual language
            that moment should trigger, just currently fired by scroll
            instead of a future Piri position. */}
        <div className="piri-portfolio-anchor" aria-hidden="true" />

        <div className="portfolio-grid">
          {PORTFOLIO_PROJECTS.map((project, i) => (
            <Reveal
              as="article"
              key={project.id}
              className={`portfolio-card${project.featured ? ' portfolio-card--featured' : ''}`}
              delay={i * 0.12}
            >
              {/* TEMPORARY placeholder in place of a real project screenshot
                  — swap for a real <img loading="lazy" src=... alt="..."/>
                  once project imagery exists; role/aria-label stand in for
                  the future alt text so screen readers aren't left with
                  nothing. */}
              <div className="portfolio-card__image" role="img" aria-label={`Pré-visualização do projeto ${project.name}`}>
                <span className="portfolio-card__image-glow" aria-hidden="true" />
              </div>
              <div className="portfolio-card__body">
                <p className="portfolio-card__category">{project.category}</p>
                <h3 className="portfolio-card__name">{project.name}</h3>
                <a href={project.href} className="portfolio-card__link">
                  Ver projeto
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
