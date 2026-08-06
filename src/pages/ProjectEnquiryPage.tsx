import { Reveal } from '../components/ui/Reveal';
import { Link } from '../lib/router';
import ProjectEnquiryForm from '../components/forms/ProjectEnquiryForm';

const icons = {
  speed: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  fit: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 14.5 9l5.9.9-4.3 4.1 1 5.9L12 17l-5.1 2.9 1-5.9L3.6 9.9 9.5 9 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

const BENEFITS = [
  {
    key: 'speed',
    title: 'Resposta rápida',
    body: 'Respondemos a todas as mensagens em menos de 24h úteis.',
    icon: icons.speed,
  },
  {
    key: 'fit',
    title: 'Soluções à medida',
    body: 'Cada projeto é único. Criamos soluções adaptadas aos teus objetivos.',
    icon: icons.fit,
  },
  {
    key: 'lock',
    title: 'Confidencialidade',
    body: 'As tuas informações e ideias estão seguras connosco.',
    icon: icons.lock,
  },
];

export default function ProjectEnquiryPage() {
  return (
    <main className="project-enquiry-page">
      <div className="content-flow content-flow--project">
        <section className="section project-enquiry-hero">
          <div className="container project-enquiry-layout">
            <div className="project-enquiry-intro">
              <Reveal as="nav" className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Início</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Começar projeto</span>
              </Reveal>

              <Reveal as="h1" className="project-enquiry-intro__heading" delay={0.05}>
                Vamos criar algo
                <br />
                <span className="project-enquiry-intro__accent">extraordinário.</span>
              </Reveal>

              <Reveal as="p" className="section__body" delay={0.12}>
                Conta-nos sobre o teu projeto e como te podemos ajudar. Respondemos o mais rápido possível.
              </Reveal>

              <Reveal as="ul" className="project-enquiry-benefits" delay={0.18}>
                {BENEFITS.map((benefit) => (
                  <li key={benefit.key} className="project-enquiry-benefits__item">
                    <span className="project-enquiry-benefits__icon">{benefit.icon}</span>
                    <span>
                      <p className="project-enquiry-benefits__title">{benefit.title}</p>
                      <p className="project-enquiry-benefits__body">{benefit.body}</p>
                    </span>
                  </li>
                ))}
              </Reveal>

              {/* Restrained decorative "Luz Viva" trail — a static curved
                  light with a gently pulsing spark, not the travelling
                  hover effect used on the portfolio cards. Purely
                  decorative: aria-hidden, no pointer events, collapses to a
                  fixed glow (no pulse) under prefers-reduced-motion. */}
              <div className="project-enquiry-trail" aria-hidden="true">
                <svg viewBox="0 0 340 180" fill="none">
                  <path
                    d="M14 168C70 176 132 150 176 118C214 90 244 58 300 30"
                    stroke="url(#lvTrailGradient)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                  <defs>
                    <linearGradient id="lvTrailGradient" x1="14" y1="168" x2="300" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#8fe0ff" stopOpacity="0" />
                      <stop offset="55%" stopColor="#8fe0ff" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="project-enquiry-trail__spark" />
              </div>
            </div>

            <Reveal as="div" className="project-enquiry-form-panel" delay={0.1}>
              <h2 className="project-enquiry-form__heading">Fala-nos do teu projeto</h2>
              <p className="section__supporting project-enquiry-form__intro">
                Preenche o formulário e descreve-nos a tua ideia.
              </p>
              <ProjectEnquiryForm />
            </Reveal>
          </div>
        </section>
      </div>
    </main>
  );
}
