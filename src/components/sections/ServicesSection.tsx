import { Reveal } from '../ui/Reveal';
import { SERVICES } from '../../data/services';

export default function ServicesSection() {
  return (
    <section className="section section--services" id="servicos">
      <div className="section__glow" aria-hidden="true" />
      <div className="container">
        <Reveal as="p" className="eyebrow">
          O que fazemos
        </Reveal>
        <Reveal as="h2" className="section__heading" delay={0.08}>
          Tudo o que uma marca precisa para ganhar luz.
        </Reveal>

        {/* Future hook: a Piri light-source (or a stand-in glow) may travel
            down this list and activate each service's highlight state in
            turn — see `data-service-index` below and `.service-row.is-lit`
            in global.css for the state that hook should eventually toggle. */}
        <div className="piri-services-anchor" aria-hidden="true" />

        <ul className="service-list">
          {SERVICES.map((service, i) => (
            <Reveal as="li" key={service.index} className="service-row" delay={i * 0.1}>
              <span className="service-row__index" data-service-index={service.index} aria-hidden="true">
                {service.index}
              </span>
              <div className="service-row__body">
                <h3 className="service-row__title">{service.title}</h3>
                <p className="service-row__description">{service.description}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
