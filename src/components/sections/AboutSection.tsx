import { Reveal } from '../ui/Reveal';
import PiriAboutMoment from './PiriAboutMoment';

export default function AboutSection() {
  return (
    <section className="section section--about" id="sobre">
      <div className="container about-grid">
        <div className="about-grid__text">
          <Reveal as="p" className="eyebrow">
            Sobre a PiriLight
          </Reveal>
          <Reveal as="h2" className="section__heading" delay={0.08}>
            Não esperamos pela luz.
            <br />
            Criamo-la.
          </Reveal>
          <Reveal as="p" className="section__body" delay={0.16}>
            A PiriLight nasceu para ajudar empresas de qualidade a tornarem-se visíveis, confiáveis e memoráveis.
          </Reveal>
          <Reveal as="p" className="section__body" delay={0.22}>
            Tal como um pirilampo produz a sua própria luz, acreditamos que cada marca pode criar uma presença capaz
            de se destacar, mesmo num mercado cheio de ruído.
          </Reveal>
          <Reveal as="p" className="section__body" delay={0.28}>
            Unimos estratégia, design, tecnologia e movimento para transformar bons negócios em marcas impossíveis
            de ignorar.
          </Reveal>
        </div>

        {/* Piri flies in from the right and settles front-facing in the
            centre of this circle, then hovers indefinitely — see
            PiriAboutMoment.tsx / PiriAboutScene.tsx. */}
        <Reveal as="div" className="about-grid__visual" delay={0.15}>
          <PiriAboutMoment />
        </Reveal>
      </div>
    </section>
  );
}
