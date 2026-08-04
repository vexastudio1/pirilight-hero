export interface NavLink {
  id: string;
  label: string;
}

// Order here drives both the header's link list and useActiveSection's
// observed target order. Keep `id` in sync with each section's `id` attr.
export const NAV_LINKS: NavLink[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'processo', label: 'Processo' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'contacto', label: 'Contacto' },
];

export const NAV_CTA_LABEL = 'Começar projeto';
