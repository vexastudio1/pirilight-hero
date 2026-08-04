import { Reveal } from '../ui/Reveal';
import { PROCESS_STAGES } from '../../data/process';

export default function ProcessSection() {
  return (
    <section className="section section--process" id="processo">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          O nosso processo
        </Reveal>
        <Reveal as="h2" className="section__heading" delay={0.08}>
          Da primeira ideia à presença final.
        </Reveal>

        <ol className="process-path">
          {/* Each stage lighting up on its own reveal, rather than a single
              continuously-scrubbed scroll value, is what gives the path its
              "progressively lights up" feel here — cheap and consistent
              with the reveal system used everywhere else on the page. */}
          {PROCESS_STAGES.map((stage, i) => (
            <Reveal as="li" key={stage.index} className="process-stage" delay={i * 0.12} threshold={0.4}>
              <span className="process-stage__marker" aria-hidden="true" />
              <span className="process-stage__index">{stage.index}</span>
              <h3 className="process-stage__title">{stage.title}</h3>
              <p className="process-stage__description">{stage.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
