import type { NavigationItem } from '../types/navigation'

export const collaboratorNavigation: NavigationItem[] = [
  { label: 'Visão geral', shortLabel: 'VG', path: '/colaborador' },
  { label: 'Novo apontamento', shortLabel: 'NA', path: '/colaborador/apontamentos/novo' },
  { label: 'Histórico', shortLabel: 'HI', path: '/colaborador/historico' },
  { label: 'Ausências', shortLabel: 'AU', path: '/colaborador/folgas' },
  { label: 'Quadro de Avisos', shortLabel: 'QA', path: '/colaborador/avisos' },
  { label: 'Meu perfil', shortLabel: 'MP', path: '/colaborador/perfil' },
]

export const directorNavigation: NavigationItem[] = [
  { label: 'Painel Diretor', shortLabel: 'DI', path: '/administracao' },
  { label: 'Equipes', shortLabel: 'EQ', path: '/administracao/equipes' },
  { label: 'Avisos', shortLabel: 'AV', path: '/avisos' },
]
