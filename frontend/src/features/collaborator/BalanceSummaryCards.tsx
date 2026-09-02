import type { DailySummary, PeriodSummary } from '../calendar/types'
import { formatMinutes, formatSignedMinutes } from '../time-entries/domain'
import { SummaryCard } from './SummaryCard'

type BalanceSummaryCardsProps = {
  todaySummary: DailySummary
  filteredSummary: PeriodSummary
  totalSummary: PeriodSummary
  periodLabel: string
}

export function BalanceSummaryCards({ todaySummary, filteredSummary, totalSummary, periodLabel }: BalanceSummaryCardsProps) {
  return (
    <section aria-label="Saldos reais do colaborador">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Saldo de hoje" value={formatSignedMinutes(todaySummary.balanceMinutes)} helper="Resultado real até o dia corporativo atual." tone={todaySummary.balanceMinutes >= 0 ? 'positive' : 'warning'} />
        <SummaryCard label={periodLabel} value={formatSignedMinutes(filteredSummary.realBalanceMinutes)} helper={`${formatMinutes(filteredSummary.workedMinutes)} apontadas no período.`} tone={filteredSummary.realBalanceMinutes >= 0 ? 'positive' : 'warning'} />
        <SummaryCard label="Saldo total acumulado" value={formatSignedMinutes(totalSummary.realBalanceMinutes)} helper="Acumulado desde a primeira carga corporativa vigente." tone={totalSummary.realBalanceMinutes >= 0 ? 'positive' : 'warning'} />
      </div>
      {filteredSummary.hasFutureDates && <p role="note" className="mt-3 text-xs ui-text-subtle">Datas futuras não são consideradas no saldo real.</p>}
    </section>
  )
}
