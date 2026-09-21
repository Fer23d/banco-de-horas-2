import type { SupervisorPendingEntry } from '../features/supervisor/types'

export type ReportRow = {
  id: string
  collaborator: string
  supervisor: string
  date: string
  activity: string
  project: string
  hours: number
  status: SupervisorPendingEntry['status']
  durationMinutes: number
  emObra: boolean
}

type Collaborator = { id: string; name: string; supervisorId?: string }
type Supervisor = { id: string; name: string }
type ReportStatusLabel = 'Aprovado' | 'Pendente' | 'Rejeitado'

const statusLabel: Record<ReportRow['status'], ReportStatusLabel> = {
  APPROVED: 'Aprovado',
  PENDING: 'Pendente',
  REJECTED: 'Rejeitado',
}

function isFieldEntry(entry: SupervisorPendingEntry) {
  const activity = entry.activityName?.toLocaleLowerCase('pt-BR') ?? ''
  return Boolean(entry.emObra) || activity.includes('campo') || activity.includes('viagem') || activity.includes('obra')
}

export function buildReportRows(entries: SupervisorPendingEntry[], collaborators: Collaborator[], supervisors: Supervisor[], startDate: string, endDate: string): ReportRow[] {
  const collaboratorSupervisors = new Map(collaborators.map((collaborator) => [collaborator.id, collaborator.supervisorId]))
  const supervisorNames = new Map(supervisors.map((supervisor) => [supervisor.id, supervisor.name]))
  return entries
    .filter((entry) => entry.entryDate >= startDate && entry.entryDate <= endDate)
    .map((entry) => {
      const supervisorId = collaboratorSupervisors.get(entry.collaboratorId)
      const durationMinutes = Number.isFinite(entry.durationMinutes) ? entry.durationMinutes : 0
      return {
        id: entry.id,
        collaborator: entry.collaboratorName,
        supervisor: supervisorNames.get(supervisorId ?? '') ?? 'Supervisão não identificada',
        date: entry.entryDate,
        activity: entry.activityName ?? (entry.emObra ? 'Serviços em campo' : 'Atividade não informada'),
        project: entry.numeroObra ?? entry.projectCode ?? 'Sem projeto/obra',
        hours: Number((durationMinutes / 60).toFixed(2)),
        status: entry.status,
        durationMinutes,
        emObra: isFieldEntry(entry),
      }
    })
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

export function toReportCsv(rows: ReportRow[]) {
  const header = ['Nome do Colaborador', 'Supervisor', 'Data', 'Atividade', 'Projeto/Obra', 'Horas', 'Status']
  const lines = rows.map((row) => [row.collaborator, row.supervisor, row.date, row.activity, row.project, row.hours.toString().replace('.', ','), statusLabel[row.status]])
  return [header, ...lines].map((line) => line.map(escapeCsv).join(';')).join('\r\n')
}
