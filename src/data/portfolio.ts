export interface PortfolioProject {
  id: string;
  /** URL segment for the case-study page: /projetos/<slug> */
  slug: string;
  name: string;
  category: string;
  /** Short summary — shown on the card (if present) and in the case-study hero. */
  description?: string;
  image?: string;
  /** Required whenever `image` is set — descriptive alt text for screen readers. */
  imageAlt?: string;
  /** External live site. Omit or leave as '#' to hide/disable the "Visitar website" button. */
  href?: string;
  featured?: boolean;
  /** Case-study sections — each is optional so a project with only partial
   * information (e.g. no confirmed results yet) simply renders fewer
   * sections instead of inventing content to fill them. */
  company?: string;
  problem?: string;
  solution?: string;
  impact?: string;
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'autoformigal',
    slug: 'autoformigal',
    name: 'Autoformigal',
    category: 'Website institucional',
    description:
      'Website institucional para oficina automóvel com mais de duas décadas de experiência em reparação e diagnóstico multimarca.',
    image: '/projects/autoformigal-project-card.webp',
    imageAlt: 'Página inicial do website da Autoformigal',
    href: '#',
    company:
      'A Autoformigal é uma oficina automóvel localizada em São Pedro da Cadeira, com mais de duas décadas de experiência em reparação e diagnóstico multimarca.',
    problem:
      'A empresa precisava de uma presença digital mais atual, capaz de transmitir a sua experiência, confiança e proximidade, apresentando os serviços e facilitando o contacto com novos clientes.',
    solution:
      'Desenvolvemos um website moderno, responsivo e visualmente ligado à identidade da oficina, com uma navegação simples, apresentação clara dos serviços, galeria de trabalhos e chamadas para contacto e pedido de orçamento.',
    impact:
      'O novo website reforça a credibilidade da Autoformigal, apresenta a oficina de forma mais profissional e oferece aos clientes uma forma mais rápida de conhecer os serviços e entrar em contacto.',
  },
  {
    id: 'beat-wave',
    slug: 'beat-wave',
    name: 'Beat Wave',
    category: 'Experiência digital',
    description: 'Website criado para uma agência portuguesa de booking musical.',
    image: '/projects/beat-wave-project-card.webp',
    imageAlt: 'Página inicial do website da Beat Wave',
    href: 'https://LINK-DO-SITE-BEAT-WAVE',
    company:
      'A Beat Wave é uma agência portuguesa de booking musical que representa DJs e artistas de música eletrónica, com uma abordagem próxima, honesta e focada em cada evento.',
    problem:
      'A agência não tinha uma presença digital capaz de transmitir o seu posicionamento, apresentar os artistas de forma clara e facilitar o contacto com promotores e clientes.',
    solution:
      'Desenvolvemos um website moderno, rápido e responsivo, com uma identidade visual imersiva, uma apresentação clara dos artistas e um processo de reservas mais simples e direto.',
    impact:
      'O novo website apresenta a Beat Wave de forma mais clara e profissional, reforça a confiança na agência e melhora a forma como é percebida online.',
  },
  {
    id: 'novo-usado',
    slug: 'novo-usado',
    name: 'Novo & Usado',
    category: 'Website comercial',
    description:
      'Website comercial para fornecedor de equipamentos novos e usados para hotelaria, restauração e retalho.',
    image: '/projects/novo-usado-project-card.webp',
    imageAlt: 'Página inicial do website da Novo & Usado',
    href: '#',
    company:
      'A Novo & Usado fornece equipamentos novos e usados para hotelaria, restauração, pastelaria, retalho e lavandaria, contando com experiência no setor desde 1994.',
    problem:
      'A empresa precisava de modernizar a sua apresentação digital e organizar melhor a oferta de equipamentos, permitindo que potenciais clientes compreendessem rapidamente os produtos e serviços disponíveis.',
    solution:
      'Criámos uma presença digital moderna e comercial, com uma estrutura clara, destaque para as principais categorias de equipamentos e chamadas para contacto e pedido de orçamento.',
    impact:
      'O novo website torna a oferta mais fácil de explorar, transmite uma imagem mais atual e profissional e ajuda potenciais clientes a chegar mais rapidamente à solução de que precisam.',
  },
  {
    id: 'dj-marques',
    slug: 'dj-marques',
    name: 'DJ M4rques',
    category: 'Website de artista',
    description: 'Website desenvolvido para apresentação, agenda e reservas do artista.',
    // No card image asset exists yet for this project — the card/detail page
    // fall back to the same CSS placeholder treatment used before real
    // screenshots existed, rather than pointing at a file that isn't there.
    href: '#',
    company: 'Website desenvolvido para apresentação, agenda e reservas do artista.',
  },
];

export function getProjectBySlug(slug: string): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find((project) => project.slug === slug);
}
