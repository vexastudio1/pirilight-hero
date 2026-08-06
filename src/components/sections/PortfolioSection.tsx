import { Reveal } from '../ui/Reveal';
import { Link } from '../../lib/router';
import { PORTFOLIO_PROJECTS } from '../../data/portfolio';

export default function PortfolioSection() {
  return (
    <section className="section section--portfolio" id="projetos">
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
              as={Link}
              to={`/projetos/${project.slug}`}
              key={project.id}
              className={`portfolio-card${project.featured ? ' portfolio-card--featured' : ''}`}
              delay={i * 0.12}
              style={{ '--card-seed': i } as never}
            >
              {/* "Luz Viva" hover effect — pure CSS, gated to hover-capable
                  pointers (see @media(hover:hover) in global.css) and
                  collapsed to a static glow under prefers-reduced-motion.
                  --card-seed above staggers each card's ignition point/timing
                  slightly so the effect doesn't feel synchronized/robotic. */}
              <span className="portfolio-card__light" aria-hidden="true">
                <span className="portfolio-card__light-bloom" />
                <span className="portfolio-card__light-trail" />
                <span className="portfolio-card__light-spark" />
              </span>

              <span className="portfolio-card__image">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.imageAlt ?? `Pré-visualização do projeto ${project.name}`}
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={600}
                    className="portfolio-card__image-img"
                  />
                ) : (
                  <span
                    className="portfolio-card__image-placeholder"
                    role="img"
                    aria-label={`Pré-visualização do projeto ${project.name}`}
                  />
                )}
                <span className="portfolio-card__image-glow" aria-hidden="true" />
              </span>
              <span className="portfolio-card__body">
                <p className="portfolio-card__category">{project.category}</p>
                <h3 className="portfolio-card__name">{project.name}</h3>
                <span className="portfolio-card__link">
                  Ver projeto
                  <span aria-hidden="true">&rarr;</span>
                </span>
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
