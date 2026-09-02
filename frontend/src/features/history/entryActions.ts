import type { DayApprovalStatus } from '../approvals/types'
import type { TimeEntryStatus } from '../time-entries/types'

type HistoryEntryActionContext = {
  entryStatus: TimeEntryStatus
  approvalStatus: DayApprovalStatus | null
  canMutate: boolean
  hasIntegralEventConflict: boolean
}

export function getHistoryEntryActions(context: HistoryEntryActionContext) {
  const mutable = context.entryStatus === 'ACTIVE'
    && context.canMutate
    && context.approvalStatus !== 'APPROVED'
    && !context.hasIntegralEventConflict

  return {
    edit: mutable,
    duplicate: mutable,
    cancel: mutable,
    completeCorrection: mutable && context.approvalStatus === 'CORRECTION_REQUESTED',
    readOnly: !mutable,
  }
}
