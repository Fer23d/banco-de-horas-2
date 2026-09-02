import type { AssignmentSnapshot } from '../squads/types'

export type DayApprovalStatus =
  | 'IN_PROGRESS'
  | 'AVAILABLE_FOR_APPROVAL'
  | 'CORRECTION_REQUESTED'
  | 'APPROVED'
  | 'REOPENED'
  | 'NO_SUBMISSION'

export interface DayApproval {
  id: string
  collaboratorId: string
  entryDate: string
  assignmentSnapshot: AssignmentSnapshot | null
  status: DayApprovalStatus
  version: number
  updatedAt: string
  correctionReason?: string
  correctionCompletedAt?: string
  approvedAt?: string
  deficitJustification?: string
  reopenJustification?: string
}

export interface CompetencyState {
  monthKey: string
  status: 'OPEN' | 'CLOSED' | 'REOPENED'
  reopenedDates: string[]
  reopenedBy?: string
  reopenedAt?: string
  reopenJustification?: string
}
