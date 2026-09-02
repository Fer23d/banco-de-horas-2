import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BalancePeriodFilter } from './BalancePeriodFilter'

describe('filtro de saldo por período', () => {
  it('oferece intervalo personalizado e ação para voltar ao mês do calendário', () => {
    const markup = renderToStaticMarkup(<BalancePeriodFilter startDate="2026-07-01" endDate="2026-07-20" isCustomRange onChange={vi.fn()} onApply={vi.fn()} onClear={vi.fn()} />)
    expect(markup).toContain('for="balance-start-date"')
    expect(markup).toContain('for="balance-end-date"')
    expect(markup).toContain('Aplicar intervalo')
    expect(markup).toContain('Usar mês do calendário')
  })
})
