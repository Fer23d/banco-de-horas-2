import { describe, expect, it } from 'vitest'
import type { DayApproval } from '../approvals/types'
import type { DailySummary } from '../calendar/types'
import { buildAttentionSummary } from './domain'

function day(date: string, workedMinutes: number, expectedMinutes: number): DailySummary {
  return {
    date, baseExpectedMinutes: expectedMinutes, expectedMinutes, justifiedMinutes: 0, workedMinutes,
    regularMinutes: Math.min(workedMinutes, expectedMinutes), extraMinutes: Math.max(workedMinutes - expectedMinutes, 0),
    missingMinutes: Math.max(expectedMinutes - workedMinutes, 0), balanceMinutes: workedMinutes - expectedMinutes,
    isFuture: false, hasIntegralEventConflict: false, visualState: workedMinutes === 0 ? 'NO_ENTRY' : workedMinutes < expectedMinutes ? 'INCOMPLETE' : 'COMPLETE',
  }
}

function approval(date: string, status: DayApproval['status']): DayApproval {
  return { id: `approval-${date}`, collaboratorId: 'collaborator-1', entryDate: date, assignmentSnapshot: null, status, version: 1, updatedAt: `${date}T12:00:00.000Z` }
}

describe('prioridades do dashboard', () => {
  it('conta pendências, dias disponíveis e correções sem incluir datas futuras', () => {
    const result = buildAttentionSummary({
      today: '2026-07-20',
      days: [day('2026-07-17', 0, 480), day('2026-07-18', 0, 0), day('2026-07-19', 480, 480), day('2026-07-21', 0, 480)],
      approvals: [approval('2026-07-17', 'AVAILABLE_FOR_APPROVAL'), approval('2026-07-19', 'CORRECTION_REQUESTED')],
    })
    expect(result).toEqual({ pendingDays: 1, availableForApprovalDays: 1, correctionRequestedDays: 1 })
  })
})
