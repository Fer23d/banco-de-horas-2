import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { DailySummary, PeriodSummary } from '../calendar/types'
import { BalanceSummaryCards } from './BalanceSummaryCards'

const todaySummary: DailySummary = {
  date: '2026-07-20', baseExpectedMinutes: 480, expectedMinutes: 480, justifiedMinutes: 0,
  workedMinutes: 420, regularMinutes: 420, extraMinutes: 0, missingMinutes: 60, balanceMinutes: -60,
  isFuture: false, hasIntegralEventConflict: false, visualState: 'INCOMPLETE',
}

const periodSummary: PeriodSummary = {
  startDate: '2026-07-01', endDate: '2026-07-31', expectedMinutes: 480, workedMinutes: 420,
  regularMinutes: 420, extraMinutes: 0, missingMinutes: 60, justifiedMinutes: 0,
  realBalanceMinutes: -60, hasFutureDates: true, days: [todaySummary],
}

describe('cards de saldo real do colaborador', () => {
  it('não apresenta projeção futura e informa o corte no dia atual', () => {
    const markup = renderToStaticMarkup(
      <BalanceSummaryCards todaySummary={todaySummary} filteredSummary={periodSummary} totalSummary={{ ...periodSummary, hasFutureDates: false }} periodLabel="Saldo do mês" />,
    )

    expect(markup).toContain('Saldo de hoje')
    expect(markup).toContain('Saldo do mês')
    expect(markup).toContain('Saldo total acumulado')
    expect(markup).not.toContain('Projeção futura')
    expect(markup).toContain('Datas futuras não são consideradas no saldo real.')
  })
})
