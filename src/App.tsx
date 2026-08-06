import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import GlobalLightField from './components/layout/GlobalLightField';
import Hero from './components/hero/Hero';
import ProblemSection from './components/sections/ProblemSection';
import MissionSection from './components/sections/MissionSection';
import PiriFlybyMoment from './components/sections/PiriFlybyMoment';
import ServicesSection from './components/sections/ServicesSection';
import ProcessSection from './components/sections/ProcessSection';
import PortfolioSection from './components/sections/PortfolioSection';
import AboutSection from './components/sections/AboutSection';
import PrinciplesSection from './components/sections/PrinciplesSection';
import FinalCTA from './components/sections/FinalCTA';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectEnquiryPage from './pages/ProjectEnquiryPage';
import { RouterProvider, useRouter, Link } from './lib/router';
import { getProjectBySlug } from './data/portfolio';

const PROJECT_ROUTE = /^\/projetos\/([^/]+)\/?$/;
const ENQUIRY_ROUTE = /^\/comecar-projeto\/?$/;

function HomePage() {
  return (
    <main>
      <Hero />
      {/* One continuous background wash spans every section from here to
          the end of the page (see `.content-flow` in global.css) — a
          single gradient painted once, not eight independent per-section
          gradients meeting at boundaries, which is what guarantees there's
          no visible seam anywhere, regardless of how precisely each
          section's own height happens to land. */}
      <div className="content-flow">
        <GlobalLightField />
        <ProblemSection />
        <MissionSection />
        <PiriFlybyMoment />
        <ServicesSection />
        <ProcessSection />
        <PortfolioSection />
        <AboutSection />
        <PrinciplesSection />
        <FinalCTA />
      </div>
    </main>
  );
}

function ProjectNotFound() {
  return (
    <main className="project-page">
      <div className="content-flow content-flow--project">
        <section className="section section--project-hero">
          <div className="container container--narrow project-not-found">
            <p className="eyebrow">Projetos</p>
            <h1 className="section__heading">Este projeto não foi encontrado.</h1>
            <p className="section__body">O link pode estar desatualizado, ou o projeto ainda não existe.</p>
            <Link to="/#projetos" className="button button--primary">
              Voltar aos projetos
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function AppRoutes() {
  const { pathname } = useRouter();

  if (ENQUIRY_ROUTE.test(pathname)) {
    return <ProjectEnquiryPage />;
  }

  const match = pathname.match(PROJECT_ROUTE);
  if (match) {
    const project = getProjectBySlug(decodeURIComponent(match[1]));
    return project ? <ProjectDetailPage project={project} /> : <ProjectNotFound />;
  }

  return <HomePage />;
}

export default function App() {
  return (
    <RouterProvider>
      <Header />
      <AppRoutes />
      <Footer />
    </RouterProvider>
  );
}
