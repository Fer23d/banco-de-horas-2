import { describe, expect, it } from 'vitest'
import { getInitialHistoryPagination, resolveHistoryPeriod, toServiceStatusFilter } from './domain'

describe('períodos do histórico individual', () => {
  it('resolve um dia específico', () => {
    expect(resolveHistoryPeriod({ mode: 'DAY', day: '2026-07-13', month: '2026-07', startDate: '', endDate: '', firstAvailableDate: '2026-01-01', today: '2026-07-20' }))
      .toEqual({ startDate: '2026-07-13', endDate: '2026-07-13' })
  })

  it('resolve uma competência mensal', () => {
    expect(resolveHistoryPeriod({ mode: 'MONTH', day: '', month: '2026-02', startDate: '', endDate: '', firstAvailableDate: '2026-01-01', today: '2026-07-20' }))
      .toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' })
  })

  it('resolve intervalo personalizado válido', () => {
    expect(resolveHistoryPeriod({ mode: 'RANGE', day: '', month: '', startDate: '2026-07-01', endDate: '2026-07-15', firstAvailableDate: '2026-01-01', today: '2026-07-20' }))
      .toEqual({ startDate: '2026-07-01', endDate: '2026-07-15' })
  })

  it('limita todos os registros ao primeiro disponível e ao dia atual', () => {
    expect(resolveHistoryPeriod({ mode: 'ALL', day: '', month: '', startDate: '', endDate: '', firstAvailableDate: '2025-01-01', today: '2026-07-20' }))
      .toEqual({ startDate: '2025-01-01', endDate: '2026-07-20' })
  })

  it('rejeita intervalo invertido', () => {
    expect(() => resolveHistoryPeriod({ mode: 'RANGE', day: '', month: '', startDate: '2026-07-20', endDate: '2026-07-01', firstAvailableDate: '2026-01-01', today: '2026-07-20' }))
      .toThrow('intervalo')
  })
})

describe('filtros e paginação do histórico individual', () => {
  it('traduz as três situações para o filtro do service', () => {
    expect(toServiceStatusFilter('ACTIVE')).toBe('ACTIVE')
    expect(toServiceStatusFilter('CANCELLED')).toBe('CANCELLED')
    expect(toServiceStatusFilter('ALL')).toBeUndefined()
  })

  it('reinicia cursor e pilha ao aplicar novos filtros', () => {
    expect(getInitialHistoryPagination()).toEqual({ cursor: undefined, cursorHistory: [] })
  })
})
