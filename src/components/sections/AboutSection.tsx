import { Reveal } from '../ui/Reveal';

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

        {/* Future hook: reserved for a Piri illustration or a lightweight
            3D/animated moment — currently just a softly glowing empty
            frame so the layout and lighting are already correct once real
            content lands here. */}
        <Reveal as="div" className="about-grid__visual" delay={0.15}>
          <div className="piri-about-visual" aria-hidden="true">
            <span className="piri-about-visual__glow" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
