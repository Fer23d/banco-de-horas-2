import type { DemoRole } from '../features/session/types'
import { addDays, eachIsoDate, getCorporateToday, getTimesheetCycle, isWeekend, type TimesheetCycle } from '../shared/utils/date'

export type EscalationLevel = 'YELLOW' | 'ORANGE' | 'RED'

export type EscalationAlert = {
  id: string
  level: EscalationLevel
  title: string
  message: string
  recipients: DemoRole[]
  cycle: TimesheetCycle
  missingDates: string[]
}

type AlertEntry = { collaboratorId: string; entryDate: string; status: string }

const recipientsByLevel: Record<EscalationLevel, DemoRole[]> = {
  YELLOW: ['COLLABORATOR'],
  ORANGE: ['COLLABORATOR', 'SUPERVISOR'],
  RED: ['COLLABORATOR', 'SUPERVISOR', 'DIRECTOR_ADMIN'],
}

function getLevel(today: string, cycle: TimesheetCycle): EscalationLevel | null {
  if (today >= addDays(cycle.endDate, 7)) return 'RED'
  if (today >= addDays(cycle.endDate, 3)) return 'ORANGE'
  if (today >= cycle.endDate) return 'YELLOW'
  return null
}

export function getEscalationAlerts({
  today = getCorporateToday(),
  cycle = getTimesheetCycle(today),
  entries,
  collaboratorId,
  recipientRole,
}: {
  today?: string
  cycle?: TimesheetCycle
  entries: AlertEntry[]
  collaboratorId?: string
  recipientRole: DemoRole
}): EscalationAlert[] {
  const level = getLevel(today, cycle)
  if (!level || !recipientsByLevel[level].includes(recipientRole)) return []
  const lastEvaluatedDate = today < cycle.endDate ? today : cycle.endDate
  const relevantEntries = entries.filter((entry) => (
    (!collaboratorId || entry.collaboratorId === collaboratorId)
    && entry.status !== 'CANCELLED'
    && entry.entryDate >= cycle.startDate
    && entry.entryDate <= lastEvaluatedDate
  ))
  const recordedDates = new Set(relevantEntries.map((entry) => entry.entryDate))
  const missingDates = eachIsoDate(cycle.startDate, lastEvaluatedDate).filter((date) => !isWeekend(date) && !recordedDates.has(date))
  if (missingDates.length === 0) return []
  const daysLabel = missingDates.length === 1 ? 'dia útil pendente' : 'dias úteis pendentes'
  const audience = level === 'YELLOW' ? 'colaborador' : level === 'ORANGE' ? 'colaborador e supervisão' : 'colaborador, supervisão e direção'
  return [{
    id: `timesheet-escalation-${level}-${cycle.startDate}`,
    level,
    title: level === 'YELLOW' ? 'Fechamento do ciclo de apontamento' : 'Pendências escaladas de apontamento',
    message: `${missingDates.length} ${daysLabel} no ciclo ${cycle.startDate} a ${cycle.endDate}. Este alerta é destinado a ${audience}.`,
    recipients: recipientsByLevel[level],
    cycle,
    missingDates,
  }]
}
