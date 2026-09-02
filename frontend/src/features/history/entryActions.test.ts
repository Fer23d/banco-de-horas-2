import { describe, expect, it } from 'vitest'
import { getHistoryEntryActions } from './entryActions'

describe('ações do apontamento no histórico', () => {
  it('oferece as ações regulares para registro ativo e mutável', () => {
    expect(getHistoryEntryActions({
      entryStatus: 'ACTIVE', approvalStatus: 'IN_PROGRESS', canMutate: true, hasIntegralEventConflict: false,
    })).toEqual({ edit: true, duplicate: true, cancel: true, completeCorrection: false, readOnly: false })
  })

  it('não oferece nenhuma ação para registro cancelado', () => {
    expect(getHistoryEntryActions({
      entryStatus: 'CANCELLED', approvalStatus: 'IN_PROGRESS', canMutate: true, hasIntegralEventConflict: false,
    })).toEqual({ edit: false, duplicate: false, cancel: false, completeCorrection: false, readOnly: true })
  })

  it('oferece conclusão somente durante correção ativa', () => {
    expect(getHistoryEntryActions({
      entryStatus: 'ACTIVE', approvalStatus: 'CORRECTION_REQUESTED', canMutate: true, hasIntegralEventConflict: false,
    }).completeCorrection).toBe(true)
  })

  it('mantém ações regulares quando aprovação não se aplica ao dia', () => {
    expect(getHistoryEntryActions({
      entryStatus: 'ACTIVE', approvalStatus: null, canMutate: true, hasIntegralEventConflict: false,
    }).edit).toBe(true)
  })
})
