export type ComunicadoTipo = 'info' | 'alerta' | 'urgente'

export interface Comunicado {
  id: string
  titulo: string
  mensagem: string
  dataPublicacao: string
  autor: string
  tipo: ComunicadoTipo
  oculto_por?: string[]
}
