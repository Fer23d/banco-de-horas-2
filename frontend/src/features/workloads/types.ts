import type { AssignmentSnapshot } from '../squads/types'

export interface WorkloadVersion {
  id: string
  collaboratorId: string
  dailyMinutes: number
  effectiveFrom: string
  status: 'APPROVED'
  createdAt: string
  approvedAt: string
}

export type WorkloadChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface WorkloadChangeRequest {
  id: string
  collaboratorId: string
  requestedDailyMinutes: number
  requestedEffectiveFrom: string
  justification: string
  status: WorkloadChangeRequestStatus
  assignmentSnapshot: AssignmentSnapshot | null
  createdAt: string
  updatedAt: string
  decidedAt?: string
  rejectionReason?: string
}
