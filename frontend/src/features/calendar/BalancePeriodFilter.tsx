import type { FormEvent } from 'react'

type BalancePeriodFilterProps = {
  startDate: string
  endDate: string
  isCustomRange: boolean
  onChange: (field: 'startDate' | 'endDate', value: string) => void
  onApply: () => void
  onClear: () => void
}

export function BalancePeriodFilter({ startDate, endDate, isCustomRange, onChange, onApply, onClear }: BalancePeriodFilterProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border ui-border ui-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]" aria-label="Selecionar período dos saldos">
      <label htmlFor="balance-start-date" className="text-sm font-bold ui-text">Data inicial<input id="balance-start-date" type="date" value={startDate} onChange={(event) => onChange('startDate', event.target.value)} className="mt-1 block w-full ui-field rounded-xl px-3 py-2 font-normal ui-text" required /></label>
      <label htmlFor="balance-end-date" className="text-sm font-bold ui-text">Data final<input id="balance-end-date" type="date" value={endDate} onChange={(event) => onChange('endDate', event.target.value)} className="mt-1 block w-full ui-field rounded-xl px-3 py-2 font-normal ui-text" required /></label>
      <button type="submit" className="self-end rounded-xl ui-button-primary px-4 py-2.5 text-sm font-bold">Aplicar intervalo</button>
      <button type="button" onClick={onClear} disabled={!isCustomRange} className="self-end rounded-xl border ui-border px-4 py-2.5 text-sm font-bold ui-text disabled:opacity-40">Usar mês do calendário</button>
    </form>
  )
}
