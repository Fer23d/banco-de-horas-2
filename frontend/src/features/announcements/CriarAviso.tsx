import { useMemo, useState, type FormEvent } from 'react'
import { organogramaDEP } from '../../data/mockDEP'
import { useSession } from '../session/useSession'
import { ANNOUNCEMENTS_STORAGE_KEY, type ComunicadoTipo } from './types'

type DestinationType = 'all' | 'team' | 'individual'
type Team = { name: string; supervisor: string; members: string[] }

const teams: Team[] = organogramaDEP.flatMap((management) => management.squads.map((squad) => ({
  name: squad.nome,
  supervisor: squad.supervisor,
  members: squad.colaboradores.map((collaborator) => collaborator.nome),
})))
const allMembers = Array.from(new Set(teams.flatMap((team) => team.members))).sort((a, b) => a.localeCompare(b, 'pt-BR'))

function readStoredAnnouncements(): Record<string, unknown>[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : []
  } catch { return [] }
}

export function CriarAviso({ onCreated }: { onCreated?: () => void }) {
  const { session } = useSession()
  const isManager = session?.role === 'SUPERVISOR' || session?.role === 'DIRECTOR_ADMIN'
  const supervisorTeam = useMemo(() => teams.find((team) => team.supervisor === session?.name) ?? teams[0], [session?.name])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [urgency, setUrgency] = useState<ComunicadoTipo>('info')
  const [destination, setDestination] = useState<DestinationType>(session?.role === 'SUPERVISOR' ? 'team' : 'all')
  const [team, setTeam] = useState(supervisorTeam?.name ?? '')
  const [individual, setIndividual] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!isManager) return null
  const availableMembers = session?.role === 'SUPERVISOR' ? (supervisorTeam?.members ?? []) : allMembers
  const fixedTeam = session?.role === 'SUPERVISOR'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanMessage = message.trim()
    if (!cleanTitle || !cleanMessage) { setFeedback('Informe o título e a mensagem do aviso.'); return }
    const resolvedDestination: DestinationType = session?.role === 'SUPERVISOR' ? (destination === 'individual' ? 'individual' : 'team') : destination
    const target = resolvedDestination === 'all' ? 'geral' : resolvedDestination === 'team' ? (fixedTeam ? supervisorTeam?.name : team) : individual
    if (!target) { setFeedback('Selecione um destinatário válido.'); return }
    const notice = { id: crypto.randomUUID?.() ?? `${Date.now()}`, titulo: cleanTitle, mensagem: cleanMessage, dataPublicacao: new Date().toISOString(), autor: session?.name ?? 'Gestão', autorId: session?.id ?? '', tipo: urgency, tipo_destinatario: resolvedDestination, alvo_referencia: target, oculto_por: [] as string[] }
    try {
      const updated = [notice, ...readStoredAnnouncements()]
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(updated))
      setTitle(''); setMessage(''); setFeedback('Aviso enviado com sucesso.'); onCreated?.()
    } catch (error) { console.error('Não foi possível salvar o aviso.', error); setFeedback('Não foi possível salvar o aviso neste navegador.') }
  }

  return <section className="rounded-2xl border ui-border ui-surface p-5" aria-labelledby="create-announcement-title"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Gestão</p><h2 id="create-announcement-title" className="mt-1 text-xl font-extrabold ui-text">Criar Novo Aviso</h2></div><form onSubmit={handleSubmit} className="space-y-4"><label className="block text-sm font-bold ui-text">Título<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full ui-field rounded-xl px-3 py-2.5 ui-text" required /></label><label className="block text-sm font-bold ui-text">Mensagem<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="mt-1 w-full ui-field rounded-xl px-3 py-2.5 ui-text" required /></label><div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-bold ui-text">Urgência<select value={urgency} onChange={(event) => setUrgency(event.target.value as ComunicadoTipo)} className="mt-1 w-full ui-field rounded-xl px-3 py-2.5 ui-text"><option value="info">Normal</option><option value="alerta">Importante</option><option value="urgente">Crítico</option></select></label><label className="block text-sm font-bold ui-text">Destinatário<select value={destination} onChange={(event) => setDestination(event.target.value as DestinationType)} className="mt-1 w-full ui-field rounded-xl px-3 py-2.5 ui-text"><option value="all" hidden={session?.role === 'SUPERVISOR'}>Todos</option><option value="team">Equipe específica</option><option value="individual">Colaborador específico</option></select></label></div>{destination === 'team' && <label className="block text-sm font-bold ui-text">Equipe<select value={fixedTeam ? supervisorTeam?.name : team} disabled={fixedTeam} onChange={(event) => setTeam(event.target.value)} className="mt-1 w-full ui-field rounded-xl px-3 py-2.5 ui-text disabled:opacity-70">{teams.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>}{destination === 'individual' && <label className="block text-sm font-bold ui-text">Colaborador<select value={individual} onChange={(event) => setIndividual(event.target.value)} className="mt-1 w-full ui-field rounded-xl px-3 py-2.5 ui-text"><option value="">Selecione</option>{availableMembers.map((member) => <option key={member} value={member}>{member}</option>)}</select></label>}{feedback && <p role="status" className="text-sm font-semibold ui-text-muted">{feedback}</p>}<button type="submit" className="ui-button-primary">Enviar Aviso</button></form></section>
}
