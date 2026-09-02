import { describe, expect, it } from 'vitest'
import type { WorkloadVersion } from './types'
import { getBaseExpectedMinutes, getWorkloadForDate } from './domain'

const versions: WorkloadVersion[] = [
  {
    id: 'workload-6h',
    collaboratorId: 'collaborator-1',
    dailyMinutes: 360,
    effectiveFrom: '2026-01-01',
    status: 'APPROVED',
    createdAt: '2025-12-01T12:00:00.000Z',
    approvedAt: '2025-12-02T12:00:00.000Z',
  },
  {
    id: 'workload-8h',
    collaboratorId: 'collaborator-1',
    dailyMinutes: 480,
    effectiveFrom: '2026-07-01',
    status: 'APPROVED',
    createdAt: '2026-06-01T12:00:00.000Z',
    approvedAt: '2026-06-02T12:00:00.000Z',
  },
]

describe('carga horária versionada', () => {
  it('seleciona a versão vigente na data sem recalcular o passado', () => {
    expect(getWorkloadForDate(versions, '2026-06-30')?.id).toBe('workload-6h')
    expect(getWorkloadForDate(versions, '2026-07-01')?.id).toBe('workload-8h')
  })

  it('aplica a carga diária em dia útil', () => {
    expect(getBaseExpectedMinutes('2026-07-20', versions)).toBe(480)
  })

  it('retorna zero no fim de semana', () => {
    expect(getBaseExpectedMinutes('2026-07-18', versions)).toBe(0)
  })

  it('retorna zero quando ainda não existe versão vigente', () => {
    expect(getBaseExpectedMinutes('2025-12-31', versions)).toBe(0)
  })
})
