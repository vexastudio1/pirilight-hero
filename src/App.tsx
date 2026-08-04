import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import GlobalLightField from './components/layout/GlobalLightField';
import Hero from './components/hero/Hero';
import ProblemSection from './components/sections/ProblemSection';
import MissionSection from './components/sections/MissionSection';
import ServicesSection from './components/sections/ServicesSection';
import ProcessSection from './components/sections/ProcessSection';
import PortfolioSection from './components/sections/PortfolioSection';
import AboutSection from './components/sections/AboutSection';
import PrinciplesSection from './components/sections/PrinciplesSection';
import FinalCTA from './components/sections/FinalCTA';

export default function App() {
  return (
    <>
      <Header />
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
          <ServicesSection />
          <ProcessSection />
          <PortfolioSection />
          <AboutSection />
          <PrinciplesSection />
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
