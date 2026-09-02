import type { AssignmentSnapshot } from '../squads/types'

export type TimeEntryStatus = 'ACTIVE' | 'CANCELLED'
export type DisciplineCode = '—' | 'A' | 'E'
export type DocumentTypeCode =
  | '—'
  | 'RN'
  | 'GR'
  | 'G'
  | 'FD'
  | 'DE'
  | 'LM'
  | 'DI'
  | 'LC'
  | 'LI'
  | 'ET'
  | 'MC'
  | 'MO'
  | 'MD'
  | 'FG'
  | 'LA'
  | 'ES'
  | 'CF'

export interface TimeEntry {
  id: string
  collaboratorId: string
  entryDate: string
  clientId: string
  projectCode: string
  activityId: string
  disciplineCode: DisciplineCode
  documentTypeCode: DocumentTypeCode
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
  | 'documentTypeCode'
  | 'durationMinutes'
  | 'details'
> & {
  endDate?: string
  weekdaysOnly?: boolean
}

export type TimeEntryValidationErrors = Partial<Record<keyof CreateTimeEntryData, string>>
