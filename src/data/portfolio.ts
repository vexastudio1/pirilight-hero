export interface PortfolioProject {
  id: string;
  name: string;
  category: string;
  description?: string;
  /** Real project screenshot — none exist yet, see PortfolioSection.tsx placeholder treatment. */
  image?: string;
  href: string;
  featured?: boolean;
}

// TEMPORARY DATA — replace with real projects (name, category, description,
// image, href) once available. Structure is final; content is not.
export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'autoformigal',
    name: 'Autoformigal',
    category: 'Website institucional',
    href: '#',
    featured: true,
  },
  {
    id: 'beat-wave',
    name: 'Beat Wave',
    category: 'Experiência digital',
    href: '#',
  },
  {
    id: 'novo-usado',
    name: 'Novo & Usado',
    category: 'Website comercial',
    href: '#',
  },
];
