import { Reveal } from '../ui/Reveal';
import { PRINCIPLES } from '../../data/principles';

export default function PrinciplesSection() {
  return (
    <section className="section section--principles">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          Como pensamos
        </Reveal>
        <Reveal as="h2" className="section__heading" delay={0.08}>
          Criar presença antes de procurar atenção.
        </Reveal>

        <ul className="principle-list">
          {PRINCIPLES.map((principle, i) => (
            <Reveal as="li" key={principle.title} className="principle-item" delay={0.15 + i * 0.12}>
              <h3 className="principle-item__title">{principle.title}</h3>
              <p className="principle-item__description">{principle.description}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
