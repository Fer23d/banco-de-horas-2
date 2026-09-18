import { describe, expect, it } from 'vitest'
import {
  compareIsoDates,
  eachIsoDate,
  getCorporateToday,
  getMonthRange,
  getTimesheetCycle,
  isIsoDate,
  isWeekend,
} from './date'

describe('datas civis no fuso corporativo', () => {
  it('obtém o dia em São Paulo sem depender do fuso do navegador', () => {
    const instant = new Date('2026-07-20T02:30:00.000Z')
    expect(getCorporateToday(instant)).toBe('2026-07-19')
  })

  it('valida datas reais e rejeita datas inexistentes', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
  })

  it('compara datas civis sem converter para timezone local', () => {
    expect(compareIsoDates('2026-07-19', '2026-07-20')).toBeLessThan(0)
    expect(compareIsoDates('2026-07-20', '2026-07-20')).toBe(0)
  })

  it('gera todos os dias de um intervalo inclusive', () => {
    expect(eachIsoDate('2026-07-30', '2026-08-02')).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ])
  })

  it('retorna início e fim do mês e identifica fim de semana', () => {
    expect(getMonthRange('2026-02')).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' })
    expect(isWeekend('2026-07-18')).toBe(true)
    expect(isWeekend('2026-07-20')).toBe(false)
  })

  it('calcula o ciclo vigente do dia 16 ao dia 15', () => {
    expect(getTimesheetCycle('2026-09-15')).toEqual({ startDate: '2026-08-16', endDate: '2026-09-15' })
    expect(getTimesheetCycle('2026-09-16')).toEqual({ startDate: '2026-09-16', endDate: '2026-10-15' })
    expect(getTimesheetCycle('2026-01-05')).toEqual({ startDate: '2025-12-16', endDate: '2026-01-15' })
  })
})
