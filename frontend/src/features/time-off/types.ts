import type { AssignmentSnapshot } from '../squads/types'

export type TimeOffRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type AbsenceType = 'Folga' | 'Férias' | 'Atestado Médico' | 'Outros'

export interface TimeOffRequest {
  id: string
  collaboratorId: string
  collaboratorName?: string
  absenceType?: AbsenceType
  startDate?: string
  endDate?: string
  date: string
  reason: string
  status: TimeOffRequestStatus
  assignmentSnapshot: AssignmentSnapshot | null
  createdAt: string
  updatedAt: string
  decidedAt?: string
  rejectionReason?: string
  cancellationReason?: string
  cancelledAt?: string
}

export function requestAppliesToDate(request: TimeOffRequest, date: string) {
  const startDate = request.startDate ?? request.date
  const endDate = request.endDate ?? request.date
  return startDate <= date && endDate >= date
}

export function requestOverlapsRange(request: TimeOffRequest, startDate: string, endDate: string) {
  const requestStartDate = request.startDate ?? request.date
  const requestEndDate = request.endDate ?? request.date
  return requestStartDate <= endDate && requestEndDate >= startDate
}
