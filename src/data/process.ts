export interface ProcessStage {
  index: string;
  title: string;
  description: string;
}

export const PROCESS_STAGES: ProcessStage[] = [
  {
    index: '01',
    title: 'Descoberta',
    description: 'Conhecemos o negócio, os objetivos, o público e aquilo que torna a marca diferente.',
  },
  {
    index: '02',
    title: 'Direção',
    description: 'Definimos a estrutura, a mensagem e a direção visual que irão orientar o projeto.',
  },
  {
    index: '03',
    title: 'Criação',
    description: 'Transformamos a estratégia numa experiência digital clara, envolvente e coerente.',
  },
  {
    index: '04',
    title: 'Lançamento',
    description: 'Testamos, otimizamos e colocamos a nova presença digital pronta para ser descoberta.',
  },
];
