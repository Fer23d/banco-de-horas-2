import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { HistoryFilters } from '../history/HistoryFilters'
import type { HistoryFiltersValue } from '../history/useTimeEntryHistory'
import { TimeEntryFields } from './TimeEntryFields'
import type { TimeEntryFormValues } from './useTimeEntryForm'

const values: TimeEntryFormValues = {
  startDate: '2026-07-20', endDate: '2026-07-20', weekdaysOnly: true, clientId: '', projectCode: '', activityId: '', disciplineCode: '', documentTypeCode: '',
  hours: '', minutes: '', details: '', editReason: '',
}

const filters: HistoryFiltersValue = {
  mode: 'MONTH', day: '2026-07-20', month: '2026-07', startDate: '2026-07-01', endDate: '2026-07-20',
  clientId: '', projectCode: '', activityId: '', disciplineCode: '', documentTypeCode: '', status: 'ACTIVE',
}

describe('markup acessível de apontamentos e histórico', () => {
  it('associa labels aos campos obrigatórios e limita a data ao dia corporativo', () => {
    const markup = renderToStaticMarkup(<TimeEntryFields values={values} errors={{}} maxDate="2026-07-20" onChange={vi.fn()} />)
    expect(markup).toContain('for="entry-start-date"')
    expect(markup).toContain('for="entry-end-date"')
    expect(markup).toContain('max="2026-07-20"')
    expect(markup).toContain('for="client"')
    expect(markup).toContain('for="project-code"')
    expect(markup).toContain('for="discipline"')
    expect(markup).toContain('for="document-type"')
  })

  it('preserva o texto do número do projeto, a atividade Outros e remove campos descontinuados', () => {
    const markup = renderToStaticMarkup(<TimeEntryFields values={values} errors={{}} maxDate="2026-07-20" onChange={vi.fn()} />)
    expect(markup).toContain('* Escreva exatamente a numeração do projeto atual, caso já possua.')
    expect(markup).toContain('Outros')
    expect(markup).toContain('Se a data final for diferente')
    expect(markup).not.toContain('Avanço')
    expect(markup).not.toContain('Documento (LD)')
  })

  it('oferece filtros de período e dados individuais com labels', () => {
    const markup = renderToStaticMarkup(<HistoryFilters value={filters} onChange={vi.fn()} onApply={vi.fn()} />)
    expect(markup).toContain('aria-label="Filtros do histórico"')
    expect(markup).toContain('for="history-mode"')
    expect(markup).toContain('for="history-client"')
    expect(markup).toContain('for="history-project"')
    expect(markup).toContain('for="history-document-type"')
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
