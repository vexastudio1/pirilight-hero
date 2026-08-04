import { Reveal } from '../ui/Reveal';

// First meaningful increase in light after the Problem section — see
// `--section-*` custom properties on `.section--mission` in global.css.
export default function MissionSection() {
  return (
    <section className="section section--mission">
      <div className="section__glow" aria-hidden="true" />
      <div className="container container--narrow">
        <Reveal as="p" className="eyebrow">
          A nossa missão
        </Reveal>
        <Reveal as="h2" className="section__heading" delay={0.08}>
          Transformamos presença em confiança.
        </Reveal>
        <Reveal as="p" className="section__body" delay={0.16}>
          Criamos experiências digitais que ajudam empresas de qualidade a serem vistas, compreendidas e escolhidas.
        </Reveal>
        <Reveal as="p" className="section__supporting" delay={0.24}>
          Não criamos apenas uma imagem mais bonita. Construímos uma presença capaz de refletir o verdadeiro valor de
          cada negócio.
        </Reveal>
      </div>
    </section>
  );
}
