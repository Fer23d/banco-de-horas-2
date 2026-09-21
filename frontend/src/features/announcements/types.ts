export type ComunicadoTipo = 'info' | 'alerta' | 'urgente'

export interface Comunicado {
  id: string
  titulo: string
  mensagem: string
  dataPublicacao: string
  autor: string
  tipo: ComunicadoTipo
  oculto_por?: string[]
  autorId?: string
  tipo_destinatario?: 'all' | 'team' | 'individual'
  alvo_referencia?: string
}

export const ANNOUNCEMENTS_STORAGE_KEY = 'avisos_sistema_banco2'

const comunicadoTypes: ComunicadoTipo[] = ['info', 'alerta', 'urgente']

function isComunicadoTipo(value: unknown): value is ComunicadoTipo {
  return typeof value === 'string' && comunicadoTypes.includes(value as ComunicadoTipo)
}

export function normalizeComunicado(value: unknown): Comunicado | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  const id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : null
  if (!id) return null

  return {
    id,
    titulo: typeof candidate.titulo === 'string' && candidate.titulo.trim() ? candidate.titulo : 'Aviso sem título',
    mensagem: typeof candidate.mensagem === 'string' ? candidate.mensagem : 'Mensagem indisponível.',
    dataPublicacao: typeof candidate.dataPublicacao === 'string' && !Number.isNaN(Date.parse(candidate.dataPublicacao)) ? candidate.dataPublicacao : new Date(0).toISOString(),
    autor: typeof candidate.autor === 'string' && candidate.autor.trim() ? candidate.autor : 'Gestão',
    tipo: isComunicadoTipo(candidate.tipo) ? candidate.tipo : 'info',
    oculto_por: Array.isArray(candidate.oculto_por) ? candidate.oculto_por.filter((item): item is string => typeof item === 'string') : [],
    autorId: typeof candidate.autorId === 'string' ? candidate.autorId : undefined,
    tipo_destinatario: candidate.tipo_destinatario === 'all' || candidate.tipo_destinatario === 'team' || candidate.tipo_destinatario === 'individual' ? candidate.tipo_destinatario : undefined,
    alvo_referencia: typeof candidate.alvo_referencia === 'string' ? candidate.alvo_referencia : undefined,
  }
}

export function parseStoredAnnouncements(value: unknown): Comunicado[] {
  return Array.isArray(value) ? value.flatMap((item) => {
    const normalized = normalizeComunicado(item)
    return normalized ? [normalized] : []
  }) : []
}
