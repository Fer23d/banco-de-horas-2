import type { CompetencyState, DayApproval, DayApprovalStatus } from './types'

type DeriveStatusInput = {
  date: string
  today: string
  competencyClosed: boolean
  hasEntries: boolean
  isApplicable?: boolean
}

export function isDayApprovalApplicable(day: {
  isFuture: boolean
  expectedMinutes: number
  workedMinutes: number
  hasIntegralEventConflict: boolean
}) {
  return !day.isFuture
    && !day.hasIntegralEventConflict
    && (day.expectedMinutes > 0 || day.workedMinutes > 0)
}

export function deriveDayApprovalStatus({ date, today, competencyClosed, hasEntries, isApplicable = true }: DeriveStatusInput): DayApprovalStatus | null {
  if (!isApplicable || date > today) return null
  if (date === today) return 'IN_PROGRESS'
  if (competencyClosed && !hasEntries) return 'NO_SUBMISSION'
  return 'AVAILABLE_FOR_APPROVAL'
}

export function canMutateDay(approval: DayApproval | null, competency: CompetencyState) {
  const dayReopened = approval?.status === 'REOPENED' || competency.reopenedDates.includes(approval?.entryDate ?? '')
  const competencyOpen = competency.status === 'OPEN' || competency.status === 'REOPENED'
  if (!competencyOpen && !dayReopened) return false
  if (!approval) return competencyOpen
  return approval.status !== 'APPROVED' && approval.status !== 'NO_SUBMISSION' || dayReopened
}

type ApprovalCommand = {
  today: string
  balanceMinutes: number
  justification: string
}

export function approveDay(current: DayApproval, command: ApprovalCommand): DayApproval {
  if (current.entryDate === command.today) throw new Error('O dia atual não pode ser aprovado.')
  if (current.entryDate > command.today) throw new Error('Um dia futuro não pode ser aprovado.')
  if (current.status !== 'AVAILABLE_FOR_APPROVAL' && current.status !== 'REOPENED') {
    throw new Error('O conjunto diário não está disponível para aprovação.')
  }
  const justification = command.justification.trim()
  if (command.balanceMinutes < 0 && !justification) throw new Error('Informe uma justificativa para aprovação com déficit.')
  return {
    ...current,
    status: 'APPROVED',
    deficitJustification: command.balanceMinutes < 0 ? justification : undefined,
    version: current.version + 1,
  }
}

export function requestCorrection(current: DayApproval, reason: string): DayApproval {
  if (current.status !== 'AVAILABLE_FOR_APPROVAL') throw new Error('O conjunto diário não está disponível para correção.')
  const correctionReason = reason.trim()
  if (!correctionReason) throw new Error('Informe a justificativa da correção.')
  return { ...current, status: 'CORRECTION_REQUESTED', correctionReason, version: current.version + 1 }
}

export function completeCorrection(current: DayApproval): DayApproval {
  if (current.status !== 'CORRECTION_REQUESTED') throw new Error('O dia não está em correção.')
  return { ...current, status: 'AVAILABLE_FOR_APPROVAL', version: current.version + 1 }
}

export function reopenDay(current: DayApproval, justification: string): DayApproval {
  if (current.status !== 'APPROVED' && current.status !== 'NO_SUBMISSION') {
    throw new Error('Somente um conjunto diário encerrado pode ser reaberto.')
  }
  const reason = justification.trim()
  if (!reason) throw new Error('Informe a justificativa da reabertura.')
  return { ...current, status: 'REOPENED', reopenJustification: reason, version: current.version + 1 }
}

export function reopenCompetency(current: CompetencyState, justification: string): CompetencyState {
  const reason = justification.trim()
  if (!reason) throw new Error('Informe a justificativa da reabertura.')
  return { ...current, status: 'REOPENED', reopenJustification: reason }
}
