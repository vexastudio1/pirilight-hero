import { Reveal } from '../ui/Reveal';

// The darkest content section — sits directly over the same persistent
// starfield the hero uses (see .problem-section in global.css), so it reads
// as the next chapter of one continuous night scene rather than a separate
// block. Uses the shared `Reveal` primitive (see components/ui/Reveal.tsx)
// instead of its own bespoke IntersectionObserver, so this section's
// "emerge from darkness" motion is identical to every other section's.
export default function ProblemSection() {
  return (
    <section className="section section--problem problem-section" id="problema">
      <div className="container container--narrow">
        <Reveal as="p" className="eyebrow">
          O problema
        </Reveal>

        <Reveal as="h2" className="section__heading" delay={0.1}>
          Muitas empresas fazem um excelente trabalho.
          <br />
          <span className="problem-section__highlight">Mas continuam na sombra.</span>
        </Reveal>

        <Reveal as="p" className="section__body" delay={0.22}>
          Não lhes falta qualidade.
          <br />
          Falta-lhes uma presença digital à altura.
        </Reveal>

        <Reveal as="p" className="section__supporting" delay={0.32}>
          Uma marca pode ser extraordinária e, ainda assim, passar despercebida quando a sua presença digital não
          transmite confiança, clareza e valor.
        </Reveal>
      </div>

      {/* Future hook: Piri may briefly cross the screen here, between the
          Problem and Services sections — currently just an empty, sized
          anchor point so that motion has a defined place to launch from
          without restructuring this section later. */}
      <div className="piri-transition-anchor" aria-hidden="true" />
    </section>
  );
}
