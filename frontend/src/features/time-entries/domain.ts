import type {
  Activity,
  Client,
  CreateTimeEntryData,
  TimeEntryValidationErrors,
} from '../../shared/types/domain'
import { compareIsoDates, eachIsoDate, isIsoDate, isWeekend } from '../../shared/utils/date'

export const MAX_ENTRY_MINUTES = 24 * 60
export const MAX_PROJECT_CODE_LENGTH = 80
export const NORMAL_WORKDAY_MINUTES = 8 * 60

export const fieldWorkActivities = [
  { id: 'field-travel', name: 'Viagem', active: true },
  { id: 'field-services', name: 'Serviços em campo', active: true },
  { id: 'field-office-support', name: 'Serviços em escritório (preparação/treinamento/relatórios)', active: true },
  { id: 'field-non-deducted-day-off', name: 'Folga de campo não descontada', active: true },
] as const

export const corporateActivities = [
  { id: 'corporate-vacation-or-no-service', name: 'Férias ou não prestação de serviço', active: true },
  { id: 'corporate-day-off', name: 'Folga corporativa', active: true },
  { id: 'corporate-deducted-day-off', name: 'Folga descontada', active: true },
  { id: 'corporate-training-event', name: 'Treinamento / evento corporativo', active: true },
] as const

export const activityOptionsByWorkContext = {
  field: fieldWorkActivities,
  corporate: corporateActivities,
} as const

export function hoursAndMinutesToMinutes(hours: number, minutes: number) {
  return hours * 60 + minutes
}

export function areValidDurationParts(hours: number, minutes: number) {
  return Number.isInteger(hours)
    && Number.isInteger(minutes)
    && hours >= 0
    && hours <= 24
    && minutes >= 0
    && minutes <= 59
    && isValidDuration(hoursAndMinutesToMinutes(hours, minutes))
}

export function formatMinutes(totalMinutes: number) {
  const absoluteMinutes = Math.abs(Math.trunc(totalMinutes))
  const hours = Math.floor(absoluteMinutes / 60).toString().padStart(2, '0')
  const minutes = (absoluteMinutes % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatSignedMinutes(totalMinutes: number) {
  if (totalMinutes === 0) return '00:00'
  return `${totalMinutes > 0 ? '+' : '-'}${formatMinutes(totalMinutes)}`
}

export function isValidDuration(durationMinutes: number) {
  return Number.isInteger(durationMinutes) && durationMinutes > 0 && durationMinutes <= MAX_ENTRY_MINUTES
}

function isValidIsoDate(value: string) {
  return isIsoDate(value)
}

export function expandTimeEntryDates(startDate: string, endDate: string, weekdaysOnly = true) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || compareIsoDates(startDate, endDate) > 0) return []
  if (startDate === endDate) return [startDate]
  return eachIsoDate(startDate, endDate).filter((date) => !weekdaysOnly || !isWeekend(date))
}

export function validateTimeEntry(
  data: CreateTimeEntryData,
  clients: Client[],
  _activities: Activity[],
  context?: { today: string },
): TimeEntryValidationErrors {
  const errors: TimeEntryValidationErrors = {}
  if (!isValidIsoDate(data.entryDate)) errors.entryDate = 'Informe uma data válida.'
  else if (context && compareIsoDates(data.entryDate, context.today) > 0) errors.entryDate = 'Não é permitido apontar horas em uma data futura.'
  if (!clients.some((client) => client.id === data.clientId && client.active)) errors.clientId = 'Selecione um cliente ativo.'
  const projectCode = data.projectCode.trim()
  if (!projectCode) errors.projectCode = 'Informe o número do projeto.'
  else if (projectCode.length > MAX_PROJECT_CODE_LENGTH) errors.projectCode = 'O número do projeto deve ter no máximo 80 caracteres.'
  const allowedContextActivities = data.emObra ? fieldWorkActivities : corporateActivities
  if (!allowedContextActivities.some((activity) => activity.id === data.activityId && activity.active)) {
    errors.activityId = data.emObra
      ? 'Selecione uma atividade de obra.'
      : 'Selecione uma atividade corporativa.'
  }
  if (data.emObra && !data.numeroObra?.trim()) errors.numeroObra = 'Informe o número da obra.'
  if (data.disciplineCode !== 'C') errors.disciplineCode = 'A disciplina deve permanecer como C – Campo.'
  if (!isValidDuration(data.durationMinutes)) errors.durationMinutes = 'A duração deve ser maior que zero e de no máximo 24 horas.'
  if (data.overtimeMinutes !== undefined && !Number.isInteger(data.overtimeMinutes)) errors.overtimeMinutes = 'Informe horas extras em horas e minutos inteiros.'
  if (data.nightMinutes !== undefined && !Number.isInteger(data.nightMinutes)) errors.nightMinutes = 'Informe horas noturnas em horas e minutos inteiros.'
  if (data.partialDayOffMinutes !== undefined && !Number.isInteger(data.partialDayOffMinutes)) errors.partialDayOffMinutes = 'Informe a folga parcial em horas e minutos inteiros.'
  if (!data.details.trim()) errors.details = 'Descreva o trabalho realizado.'
  return errors
}
