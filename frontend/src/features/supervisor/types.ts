export type SupervisorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type SupervisorPendingEntry = {
  id: string
  collaboratorId: string
  collaboratorName: string
  entryDate: string
  projectCode: string
  durationMinutes: number
  status: SupervisorApprovalStatus
  activityName?: string
  rejectionReason?: string
  decidedAt?: string
  decidedBy?: string
}

export type SupervisorTimeOffRequest = {
  id: string
  collaboratorId: string
  collaboratorName: string
  absenceType: string
  startDate: string
  endDate: string
  date: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  rejectionReason?: string
  decidedAt?: string
}

export type SupervisorDashboardSummary = {
  pending: number
  approved: number
  rejected: number
}

export type SupervisorRequestSummary = {
  pending: number
  approved: number
  rejected: number
}
