import { useEffect, useMemo, useState } from 'react'
import { useSession } from '../features/session/useSession'
import type { Comunicado, ComunicadoTipo } from '../features/announcements/types'
import { PageContainer } from '../components/PageContainer'

const STORAGE_KEY = 'avisos_sistema_banco2'
const defaultAnnouncements: Comunicado[] = [
  { id: 'b2-fechamento-setembro', titulo: 'Fechamento do mês', mensagem: 'Confira seus apontamentos e regularize pendências antes do fechamento mensal.', dataPublicacao: '2026-09-01', autor: 'RH', tipo: 'alerta' },
  { id: 'b2-comunicado-operacao', titulo: 'Atualização da operação', mensagem: 'O quadro de avisos concentra comunicados importantes da Diretoria e da supervisão.', dataPublicacao: '2026-08-28', autor: 'Diretoria', tipo: 'info' },
]
const presentation: Record<ComunicadoTipo, { label: string; border: string; badge: string }> = {
  info: { label: 'Informação', border: '[border-left-color:#8AB7C7]', badge: 'border-[#8AB7C7]/40 bg-[#8AB7C7]/10 text-[#8AB7C7]' },
  alerta: { label: 'Atenção', border: '[border-left-color:#C9A66B]', badge: 'border-[#C9A66B]/40 bg-[#C9A66B]/10 text-[#C9A66B]' },
  urgente: { label: 'Urgente', border: '[border-left-color:#C99393]', badge: 'border-[#C99393]/40 bg-[#C99393]/10 text-[#C99393]' },
}
function readAnnouncements(): Comunicado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnnouncements)); return defaultAnnouncements }
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
export function AvisosPage() {
  const { session } = useSession()
  const [announcements, setAnnouncements] = useState<Comunicado[]>([])
  const userId = session?.id ?? ''
  useEffect(() => {
    setAnnouncements(readAnnouncements())
    const handleStorage = () => setAnnouncements(readAnnouncements())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
  const visibleAnnouncements = useMemo(() => announcements.filter((announcement) => !announcement.oculto_por?.includes(userId)).sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao)), [announcements, userId])
  function hideForMe(id: string) {
    const updated = announcements.map((announcement) => announcement.id === id ? { ...announcement, oculto_por: [...new Set([...(announcement.oculto_por ?? []), userId])] } : announcement)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setAnnouncements(updated)
  }
  return (
    <PageContainer title="Quadro de Avisos" description="Acompanhe comunicados importantes da Diretoria, do RH e da supervisão da operação." contained={false}>
      <section className="space-y-4" aria-labelledby="announcements-title">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Comunicados</p><h2 id="announcements-title" className="mt-1 text-xl font-extrabold ui-text">Mensagens recentes</h2></div><span className="text-sm text-[var(--color-text-muted)]">{visibleAnnouncements.length} comunicado(s)</span></div>
        <div className="space-y-4">
          {visibleAnnouncements.length > 0 ? visibleAnnouncements.map((announcement) => { const style = presentation[announcement.tipo]; return <article key={announcement.id} className={`rounded-2xl border border-l-4 ui-border ui-surface p-5 shadow-sm ${style.border}`}><header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-extrabold ui-text">{announcement.titulo}</h3><p className="mt-1 text-sm text-[var(--color-text-muted)]">Publicado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${announcement.dataPublicacao}T00:00:00.000Z`))} · por {announcement.autor}</p></div><span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${style.badge}`}>{style.label}</span></header><p className="mt-4 max-w-4xl text-sm leading-7 ui-text-muted">{announcement.mensagem}</p><button type="button" onClick={() => hideForMe(announcement.id)} className="mt-4 text-xs font-bold text-[var(--color-text-muted)] underline">Dispensar aviso</button></article> }) : <p className="rounded-2xl border ui-border ui-surface p-5 text-sm ui-text-muted">Nenhum comunicado disponível.</p>}
        </div>
      </section>
    </PageContainer>
  )
}
