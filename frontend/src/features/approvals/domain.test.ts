import { describe, expect, it } from 'vitest'
import type { CompetencyState, DayApproval } from './types'
import {
  approveDay,
  canMutateDay,
  completeCorrection,
  deriveDayApprovalStatus,
  isDayApprovalApplicable,
  reopenCompetency,
  reopenDay,
  requestCorrection,
} from './domain'

const assignment = {
  squadId: 'squad-automation',
  squadName: 'Engenharia de Automação',
  supervisorId: 'supervisor-1',
  supervisorName: 'Jeen Carlos E. Azevedo',
}

function approval(status: DayApproval['status']): DayApproval {
  return {
    id: 'approval-1',
    collaboratorId: 'collaborator-1',
    entryDate: '2026-07-17',
    assignmentSnapshot: assignment,
    status,
    version: 1,
    updatedAt: '2026-07-18T12:00:00.000Z',
  }
}

describe('fluxo consolidado do dia', () => {
  it('distingue dias aplicáveis de futuro, ausência de jornada e evento integral', () => {
    expect(isDayApprovalApplicable({ isFuture: true, expectedMinutes: 480, workedMinutes: 0, hasIntegralEventConflict: false })).toBe(false)
    expect(isDayApprovalApplicable({ isFuture: false, expectedMinutes: 0, workedMinutes: 0, hasIntegralEventConflict: false })).toBe(false)
    expect(isDayApprovalApplicable({ isFuture: false, expectedMinutes: 480, workedMinutes: 60, hasIntegralEventConflict: true })).toBe(false)
    expect(isDayApprovalApplicable({ isFuture: false, expectedMinutes: 480, workedMinutes: 0, hasIntegralEventConflict: false })).toBe(true)
    expect(isDayApprovalApplicable({ isFuture: false, expectedMinutes: 0, workedMinutes: 60, hasIntegralEventConflict: false })).toBe(true)
  })

  it('mantém o dia atual em andamento', () => {
    expect(deriveDayApprovalStatus({ date: '2026-07-20', today: '2026-07-20', competencyClosed: false, hasEntries: true })).toBe('IN_PROGRESS')
  })

  it('não deriva nem aprova conjunto de data futura', () => {
    expect(deriveDayApprovalStatus({ date: '2026-07-21', today: '2026-07-20', competencyClosed: false, hasEntries: true })).toBeNull()
    expect(() => approveDay(approval('AVAILABLE_FOR_APPROVAL'), { today: '2026-07-16', balanceMinutes: 0, justification: '' })).toThrow('futuro')
  })

  it('torna dia anterior disponível para aprovação', () => {
    expect(deriveDayApprovalStatus({ date: '2026-07-19', today: '2026-07-20', competencyClosed: false, hasEntries: true })).toBe('AVAILABLE_FOR_APPROVAL')
  })

  it('marca ausência de envio após fechamento sem criar horas fictícias', () => {
    expect(deriveDayApprovalStatus({ date: '2026-06-30', today: '2026-07-20', competencyClosed: true, hasEntries: false })).toBe('NO_SUBMISSION')
  })

  it('impede aprovação do dia atual', () => {
    expect(() => approveDay(approval('IN_PROGRESS'), { today: '2026-07-17', balanceMinutes: 0, justification: '' })).toThrow('dia atual')
  })

  it('exige justificativa para aprovação com déficit', () => {
    expect(() => approveDay(approval('AVAILABLE_FOR_APPROVAL'), { today: '2026-07-20', balanceMinutes: -60, justification: '  ' })).toThrow('justificativa')
  })

  it('aprova um conjunto diário abaixo da carga quando há justificativa', () => {
    const result = approveDay(approval('AVAILABLE_FOR_APPROVAL'), {
      today: '2026-07-20',
      balanceMinutes: -60,
      justification: 'Atividade externa autorizada',
    })
    expect(result.status).toBe('APPROVED')
    expect(result.deficitJustification).toBe('Atividade externa autorizada')
  })

  it('rejeita aprovação e correção fora dos estados permitidos', () => {
    expect(() => approveDay(approval('APPROVED'), { today: '2026-07-20', balanceMinutes: 0, justification: '' })).toThrow('disponível')
    expect(() => approveDay(approval('CORRECTION_REQUESTED'), { today: '2026-07-20', balanceMinutes: 0, justification: '' })).toThrow('disponível')
    expect(() => requestCorrection(approval('APPROVED'), 'Revisar')).toThrow('disponível')
  })

  it('mantém correção solicitada durante múltiplas edições e conclui explicitamente', () => {
    const requested = requestCorrection(approval('AVAILABLE_FOR_APPROVAL'), 'Detalhar o resultado entregue')
    expect(requested.status).toBe('CORRECTION_REQUESTED')
    expect(canMutateDay(requested, { monthKey: '2026-07', status: 'OPEN', reopenedDates: [] })).toBe(true)
    const concluded = completeCorrection({ ...requested, version: requested.version + 2 })
    expect(concluded.status).toBe('AVAILABLE_FOR_APPROVAL')
    expect(concluded.version).toBe(requested.version + 3)
  })

  it('bloqueia aprovado e permite novamente quando o dia é reaberto', () => {
    const approved = approval('APPROVED')
    const competency: CompetencyState = { monthKey: '2026-07', status: 'OPEN', reopenedDates: [] }
    expect(canMutateDay(approved, competency)).toBe(false)
    expect(canMutateDay(reopenDay(approved, 'Ajuste autorizado'), competency)).toBe(true)
  })

  it('reabre somente a competência explicitamente indicada', () => {
    const closed: CompetencyState = { monthKey: '2026-06', status: 'CLOSED', reopenedDates: [] }
    const reopened = reopenCompetency(closed, 'Correção mensal autorizada')
    expect(reopened.status).toBe('REOPENED')
    expect(canMutateDay(approval('AVAILABLE_FOR_APPROVAL'), reopened)).toBe(true)
  })
})
