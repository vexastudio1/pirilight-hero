import { Reveal } from '../components/ui/Reveal';
import { Link } from '../lib/router';
import type { PortfolioProject } from '../data/portfolio';

interface CaseStudySection {
  key: string;
  title: string;
  body?: string;
  icon: JSX.Element;
}

// Small blue line-icons, drawn inline so the four case-study sections don't
// need an icon library dependency for four one-off glyphs.
const icons = {
  company: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 21V6.5L12 3l8 3.5V21" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 10h.01M12 10h.01M15 10h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  problem: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 16.2h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  solution: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5c-3.3 0-6 2.5-6 5.8 0 2.2 1.2 3.6 2.3 4.7.7.7 1.2 1.3 1.2 2h5c0-.7.5-1.3 1.2-2 1.1-1.1 2.3-2.5 2.3-4.7 0-3.3-2.7-5.8-6-5.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9.5 18.5h5M10 20.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  impact: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18l5-6 4 3 7-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

interface ProjectDetailPageProps {
  project: PortfolioProject;
}

export default function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  const hasExternalLink = Boolean(project.href && project.href !== '#');

  const sections: CaseStudySection[] = [
    { key: 'company', title: 'A empresa', body: project.company, icon: icons.company },
    { key: 'problem', title: 'O problema', body: project.problem, icon: icons.problem },
    { key: 'solution', title: 'A solução', body: project.solution, icon: icons.solution },
    { key: 'impact', title: 'O impacto', body: project.impact, icon: icons.impact },
  ].filter((section): section is CaseStudySection & { body: string } => Boolean(section.body));

  return (
    <main className="project-page">
      <div className="content-flow content-flow--project">
        <section className="section section--project-hero">
          <div className="container">
            <Reveal as="nav" className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/#projetos">Projetos</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{project.name}</span>
            </Reveal>

            <div className="project-hero">
              <div className="project-hero__visual project-enter-left">

                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.imageAlt ?? `Pré-visualização do projeto ${project.name}`}
                    loading="eager"
                    decoding="async"
                    width={800}
                    height={600}
                    className="project-hero__image"
                  />
                ) : (
                  <span
                    className="project-hero__image-placeholder"
                    role="img"
                    aria-label={`Pré-visualização do projeto ${project.name}`}
                  />
                )}
              </div>

              <div className="project-hero__body project-enter-right">

                <p className="portfolio-card__category">{project.category}</p>
                <h1 className="project-hero__name">{project.name}</h1>
                {project.description && <p className="section__body project-hero__summary">{project.description}</p>}

                {hasExternalLink ? (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button--primary"
                  >
                    Visitar website
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                ) : (
                  <p className="project-hero__no-link">Website ainda não disponível publicamente.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {sections.length > 0 && (
          <section className="section section--case-study">
            <div className="container container--narrow">
              <div className="case-study">
                {sections.map((section, i) => (
                  <Reveal as="article" key={section.key} className="case-study__item" delay={i * 0.1}>
                    <span className="case-study__icon">{section.icon}</span>
                    <h2 className="case-study__title">{section.title}</h2>
                    <p className="case-study__body">{section.body}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section section--project-cta">
          <div className="container container--narrow project-cta">
            <Reveal as="p" className="project-cta__heading">
              Pronto para iluminar o teu negócio?
            </Reveal>
            <Reveal as="div" delay={0.08}>
              <Link to="/comecar-projeto" className="button button--primary">
                Começar projeto
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </main>
  );
}
