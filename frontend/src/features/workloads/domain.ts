import { isWeekend } from '../../shared/utils/date'
import type { WorkloadVersion } from './types'
import { requiresWorkSiteNumber } from '../time-entries/domain'

export function getWorkloadForDate(versions: WorkloadVersion[], date: string) {
  return versions
    .filter((version) => version.status === 'APPROVED' && version.effectiveFrom <= date)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0]
}

type EntryContext = { emObra?: boolean; activityId?: string; status?: string }

export function getExpectedMinutesForDate(date: string, versions: WorkloadVersion[], entries: EntryContext[] = []) {
  if (isWeekend(date)) return 0
  const isFieldDay = entries.some((entry) => entry.status !== 'CANCELLED' && (entry.emObra || requiresWorkSiteNumber(entry.activityId ?? '')))
  if (isFieldDay) return new Date(`${date}T12:00:00.000Z`).getUTCDay() === 5 ? 8 * 60 : 9 * 60
  return getWorkloadForDate(versions, date)?.dailyMinutes ?? 0
}

export function getBaseExpectedMinutes(date: string, versions: WorkloadVersion[], entries: EntryContext[] = []) {
  return getExpectedMinutesForDate(date, versions, entries)
}
