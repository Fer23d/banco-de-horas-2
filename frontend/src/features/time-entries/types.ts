import type { AssignmentSnapshot } from '../squads/types'

export type TimeEntryStatus = 'ACTIVE' | 'CANCELLED'
export type DisciplineCode = 'C'

export interface TimeEntry {
  id: string
  collaboratorId: string
  entryDate: string
  emObra: boolean
  numeroObra?: string
  clientId: string
  projectCode: string
  activityId: string
  disciplineCode: DisciplineCode
  durationMinutes: number
  details: string
  assignmentSnapshot: AssignmentSnapshot | null
  status: TimeEntryStatus
  version: number
  createdAt: string
  updatedAt: string
  lastEditReason?: string
  sourceEntryId?: string
  cancelledAt?: string
  cancelReason?: string
}

export type CreateTimeEntryData = Pick<
  TimeEntry,
  | 'entryDate'
  | 'clientId'
  | 'projectCode'
  | 'activityId'
  | 'disciplineCode'
  | 'durationMinutes'
  | 'details'
> & {
  emObra?: boolean
  numeroObra?: string
  endDate?: string
  weekdaysOnly?: boolean
}

export type TimeEntryValidationErrors = Partial<Record<keyof CreateTimeEntryData, string>>
