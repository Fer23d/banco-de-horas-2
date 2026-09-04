import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { HistoryFilters } from '../history/HistoryFilters'
import type { HistoryFiltersValue } from '../history/useTimeEntryHistory'
import { TimeEntryFields } from './TimeEntryFields'
import type { TimeEntryFormValues } from './useTimeEntryForm'

const values: TimeEntryFormValues = {
  startDate: '2026-07-20', endDate: '2026-07-20', weekdaysOnly: true, emObra: false, numeroObra: '', clientId: '', projectCode: '', activityId: '', disciplineCode: 'C',
  hours: '', minutes: '', isHoliday: false, hasOvertime: false, overtimeHours: '', overtimeMinutes: '', hasNightHours: false, nightHours: '', nightMinutes: '', hasPartialDayOff: false, partialDayOffHours: '', partialDayOffMinutes: '', details: '', editReason: '',
}

const filters: HistoryFiltersValue = {
  mode: 'MONTH', day: '2026-07-20', month: '2026-07', startDate: '2026-07-01', endDate: '2026-07-20',
  clientId: '', projectCode: '', activityId: '', disciplineCode: '', status: 'ACTIVE',
}

describe('markup acessível de apontamentos e histórico', () => {
  it('associa labels aos campos obrigatórios e limita a data ao dia corporativo', () => {
    const markup = renderToStaticMarkup(<TimeEntryFields values={values} errors={{}} maxDate="2026-07-20" extractedRdoDays={[]} onRdoDaysChange={vi.fn()} onChange={vi.fn()} />)
    expect(markup).toContain('for="entry-start-date"')
    expect(markup).toContain('for="entry-end-date"')
    expect(markup).toContain('max="2026-07-20"')
    expect(markup).toContain('for="client"')
    expect(markup).toContain('for="project-code"')
    expect(markup).toContain('for="discipline"')
    expect(markup).toContain('C – Campo')
    expect(markup).not.toContain('Tipo de documento')
  })

  it('preserva o texto do número do projeto e exibe atividades corporativas quando não está em obra', () => {
    const markup = renderToStaticMarkup(<TimeEntryFields values={values} errors={{}} maxDate="2026-07-20" extractedRdoDays={[]} onRdoDaysChange={vi.fn()} onChange={vi.fn()} />)
    expect(markup).toContain('* Escreva exatamente a numeração do projeto atual, caso já possua.')
    expect(markup).toContain('Estava em obra?')
    expect(markup).toContain('Férias ou não prestação de serviço')
    expect(markup).toContain('Treinamento / evento corporativo')
    expect(markup).toContain('Se a data final for diferente')
    expect(markup).not.toContain('Avanço')
    expect(markup).not.toContain('Documento (LD)')
  })

  it('oculta número do projeto e exibe número da obra quando está em campo', () => {
    const markup = renderToStaticMarkup(<TimeEntryFields values={{ ...values, emObra: true }} errors={{}} maxDate="2026-07-20" extractedRdoDays={[]} onRdoDaysChange={vi.fn()} onChange={vi.fn()} />)
    expect(markup).toContain('for="work-site-number"')
    expect(markup).toContain('Número da obra')
    expect(markup).toContain('Serviços em campo')
    expect(markup).not.toContain('for="project-code"')
    expect(markup).not.toContain('Número do projeto')
  })

  it('oferece filtros de período e dados individuais com labels', () => {
    const markup = renderToStaticMarkup(<HistoryFilters value={filters} onChange={vi.fn()} onApply={vi.fn()} />)
    expect(markup).toContain('aria-label="Filtros do histórico"')
    expect(markup).toContain('for="history-mode"')
    expect(markup).toContain('for="history-client"')
    expect(markup).toContain('for="history-project"')
    expect(markup).not.toContain('for="history-document-type"')
    expect(markup).toContain('Situação do apontamento')
    expect(markup).toContain('Somente ativos')
    expect(markup).toContain('Somente cancelados')
    expect(markup).not.toContain('Exibição paginada')
  })

  it('nomeia a confirmação de cancelamento sem usar alert do navegador', () => {
    const markup = renderToStaticMarkup(<ConfirmDialog open title="Cancelar apontamento?" description="Confirme a operação" confirmLabel="Confirmar" onCancel={vi.fn()} onConfirm={vi.fn()} />)
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('Cancelar apontamento?')
  })
})
