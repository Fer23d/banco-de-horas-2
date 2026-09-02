import type { DayApproval } from '../approvals/types'
import type { DailySummary } from '../calendar/types'

export function buildAttentionSummary({ today, days, approvals }: { today: string; days: DailySummary[]; approvals: DayApproval[] }) {
  return {
    pendingDays: days.filter((day) => day.date <= today && day.expectedMinutes > 0 && day.workedMinutes === 0 && day.visualState === 'NO_ENTRY').length,
    availableForApprovalDays: approvals.filter((approval) => approval.status === 'AVAILABLE_FOR_APPROVAL').length,
    correctionRequestedDays: approvals.filter((approval) => approval.status === 'CORRECTION_REQUESTED').length,
  }
}
