import { useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { demoClients } from '../../mocks/demoData'
import { activityOptionsByWorkContext, formatMinutes } from '../time-entries/domain'
import type { SupervisorPendingEntry } from './types'

type SupervisorEntriesTableProps = {
  entries: SupervisorPendingEntry[]
  isMutating: boolean
  selectedIds: string[]
  onToggleAll: (checked: boolean) => void
  onToggleEntry: (entryId: string, checked: boolean) => void
  onApprove: (entry: SupervisorPendingEntry) => void
  onReject: (entry: SupervisorPendingEntry) => void
}

const statusView = {
  PENDING: { label: 'Pendente', tone: 'pending' },
  APPROVED: { label: 'Aprovado', tone: 'success' },
  REJECTED: { label: 'Rejeitado', tone: 'danger' },
} as const

const activityOptions = [
  ...activityOptionsByWorkContext.field,
  ...activityOptionsByWorkContext.corporate,
]

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`))
}

function resolveClientName(clientId?: string) {
  if (!clientId) return 'Não informado'
  return demoClients.find((client) => client.id === clientId)?.name ?? clientId
}

function resolveActivityName(activityName?: string) {
  if (!activityName) return 'Não informada'
  return activityOptions.find((activity) => activity.id === activityName)?.name ?? activityName
}

function EntryDetailsDialog({ entry, onClose }: { entry: SupervisorPendingEntry | null; onClose: () => void }) {
  if (!entry) return null
  const status = statusView[entry.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="entry-details-title" className="ui-card max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Detalhes do apontamento</p>
            <h2 id="entry-details-title" className="mt-1 text-xl font-extrabold text-[var(--color-primary)]">{entry.collaboratorName}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{formatDate(entry.entryDate)} · Projeto {entry.projectCode}</p>
          </div>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Cliente</dt>
            <dd className="mt-1 font-bold text-[var(--color-text)]">{resolveClientName(entry.clientId)}</dd>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Atividade</dt>
            <dd className="mt-1 font-bold text-[var(--color-text)]">{resolveActivityName(entry.activityName)}</dd>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Horas</dt>
            <dd className="mt-1 font-bold text-[var(--color-text)]">{formatMinutes(entry.durationMinutes)}</dd>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Contexto</dt>
            <dd className="mt-1 font-bold text-[var(--color-text)]">{entry.emObra ? 'Em obra' : 'Corporativo'}</dd>
          </div>
          {entry.numeroObra && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Número da obra</dt>
              <dd className="mt-1 font-bold text-[var(--color-text)]">{entry.numeroObra}</dd>
            </div>
          )}
          {entry.rejectionReason && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Motivo da rejeição</dt>
              <dd className="mt-1 font-bold text-[var(--color-text)]">{entry.rejectionReason}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-sm font-extrabold text-[var(--color-text)]">Detalhamento das atividades / Observações</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
            {entry.details?.trim() || 'Nenhum detalhamento informado.'}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="ui-button-secondary">Fechar</button>
        </div>
      </section>
    </div>
  )
}

export function SupervisorEntriesTable({ entries, isMutating, selectedIds, onToggleAll, onToggleEntry, onApprove, onReject }: SupervisorEntriesTableProps) {
  const [detailsEntry, setDetailsEntry] = useState<SupervisorPendingEntry | null>(null)

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="font-bold text-[var(--color-text)]">Nenhum apontamento encontrado.</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Ajuste os filtros para consultar o histórico da equipe.</p>
      </div>
    )
  }
  const allVisibleSelected = entries.length > 0 && entries.every((entry) => selectedIds.includes(entry.id))

  return (
    <section className="ui-card overflow-hidden rounded-2xl" aria-labelledby="supervisor-entries-title">
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Histórico completo</p>
          <h2 id="supervisor-entries-title" className="mt-1 text-xl font-extrabold text-[var(--color-text)]">Apontamentos da equipe</h2>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">{entries.length} registro(s)</p>
      </div>

      <div className="hidden max-h-[600px] overflow-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            <tr>
              <th scope="col" className="px-5 py-4">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) => onToggleAll(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-primary)]"
                  aria-label="Selecionar todos os apontamentos visíveis"
                />
              </th>
              <th scope="col" className="px-5 py-4">Colaborador</th>
              <th scope="col" className="px-5 py-4">Data</th>
              <th scope="col" className="px-5 py-4">Projeto</th>
              <th scope="col" className="px-5 py-4">Horas</th>
              <th scope="col" className="px-5 py-4">Status</th>
              <th scope="col" className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y ui-divide">
            {entries.map((entry) => {
              const status = statusView[entry.status]
              const isPending = entry.status === 'PENDING'
              return (
                <tr key={entry.id} className="transition hover:bg-[var(--color-surface-subtle)]">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(entry.id)}
                      onChange={(event) => onToggleEntry(entry.id, event.target.checked)}
                      className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-primary)]"
                      aria-label={`Selecionar apontamento de ${entry.collaboratorName}`}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-[var(--color-text)]">{entry.collaboratorName}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{entry.activityName}</p>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-muted)]">{formatDate(entry.entryDate)}</td>
                  <td className="px-5 py-4 font-semibold text-[var(--color-text)]">{entry.projectCode}</td>
                  <td className="px-5 py-4 text-[var(--color-text-muted)]">{formatMinutes(entry.durationMinutes)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    {entry.rejectionReason && <p className="mt-2 max-w-52 text-xs text-[var(--color-text-muted)]">{entry.rejectionReason}</p>}
                  </td>
                  <td className="px-5 py-4">
                    {isPending ? (
                      <div className="flex justify-end gap-2">
                        <button type="button" className="rounded-xl border ui-border px-3 py-2 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]" onClick={() => setDetailsEntry(entry)}>
                          Ver detalhes
                        </button>
                        <button type="button" className="ui-button-secondary px-3 py-2" onClick={() => onReject(entry)} disabled={isMutating}>
                          Rejeitar
                        </button>
                        <button type="button" className="ui-button-primary px-3 py-2" onClick={() => onApprove(entry)} disabled={isMutating}>
                          Aprovar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button type="button" className="rounded-xl border ui-border px-3 py-2 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]" onClick={() => setDetailsEntry(entry)}>
                          Ver detalhes
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="max-h-[600px] divide-y overflow-y-auto ui-divide md:hidden">
        {entries.map((entry) => {
          const status = statusView[entry.status]
          const isPending = entry.status === 'PENDING'
          return (
            <article key={entry.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(entry.id)}
                  onChange={(event) => onToggleEntry(entry.id, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-primary)]"
                  aria-label={`Selecionar apontamento de ${entry.collaboratorName}`}
                />
                <div>
                  <h3 className="font-extrabold text-[var(--color-text)]">{entry.collaboratorName}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{entry.projectCode} · {formatDate(entry.entryDate)}</p>
                </div>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Horas</dt>
                  <dd className="mt-1 font-bold text-[var(--color-text)]">{formatMinutes(entry.durationMinutes)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Atividade</dt>
                  <dd className="mt-1 font-bold text-[var(--color-text)]">{entry.activityName}</dd>
                </div>
              </dl>
              {entry.rejectionReason && <p className="mt-3 text-sm text-[var(--color-text-muted)]">{entry.rejectionReason}</p>}
              <div className={`mt-4 grid gap-2 ${isPending ? 'grid-cols-3' : 'grid-cols-1'}`}>
                <button type="button" className="rounded-xl border ui-border px-3 py-2 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]" onClick={() => setDetailsEntry(entry)}>
                  Ver detalhes
                </button>
                {isPending && (
                  <>
                  <button type="button" className="ui-button-secondary" onClick={() => onReject(entry)} disabled={isMutating}>
                    Rejeitar
                  </button>
                  <button type="button" className="ui-button-primary" onClick={() => onApprove(entry)} disabled={isMutating}>
                    Aprovar
                  </button>
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <EntryDetailsDialog entry={detailsEntry} onClose={() => setDetailsEntry(null)} />
    </section>
  )
}
