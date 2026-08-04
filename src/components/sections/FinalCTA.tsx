import { Reveal } from '../ui/Reveal';

export default function FinalCTA() {
  return (
    <section className="section section--final" id="contacto">
      <div className="section__glow section__glow--final" aria-hidden="true" />
      <div className="final-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={`final-particle final-particle--${i}`} />
        ))}
      </div>

      {/* Future hook: Piri may return here, illuminate the CTA, and settle
          near the final message as the page reaches its brightest state. */}
      <div className="piri-final-anchor" aria-hidden="true" />

      <div className="container container--narrow final-cta__content">
        <Reveal as="p" className="eyebrow">
          O próximo passo
        </Reveal>
        <Reveal as="h2" className="section__heading final-cta__heading" delay={0.08}>
          Está na hora de dar luz ao seu negócio.
        </Reveal>
        <Reveal as="p" className="section__body" delay={0.16}>
          Vamos criar uma presença digital à altura do trabalho que já faz.
        </Reveal>
        <Reveal as="div" className="final-cta__actions" delay={0.24}>
          <a href="mailto:ola@pirilight.pt" className="button button--primary">
            Começar um projeto
          </a>
          <a href="mailto:ola@pirilight.pt" className="button button--secondary">
            Falar connosco
          </a>
        </Reveal>
      </div>
    </section>
  );
}
