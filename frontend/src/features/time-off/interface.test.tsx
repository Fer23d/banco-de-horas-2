import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { TimeOffRequest } from './types'
import { TimeOffRequestForm } from './TimeOffRequestForm'
import { TimeOffRequestList } from './TimeOffRequestList'

const pending: TimeOffRequest = {
  id: 'request-1', collaboratorId: 'collaborator-1', absenceType: 'Folga', startDate: '2026-07-25', endDate: '2026-07-25', date: '2026-07-25', reason: 'Compromisso', status: 'PENDING',
  assignmentSnapshot: null, createdAt: '2026-07-20T12:00:00.000Z', updatedAt: '2026-07-20T12:00:00.000Z',
}

describe('interface de ausências do colaborador', () => {
  it('associa labels, restringe a data futura e explica a aprovação necessária', () => {
    const markup = renderToStaticMarkup(<TimeOffRequestForm absenceType="Folga" startDate="" endDate="" reason="" minDate="2026-07-21" isSubmitting={false} onAbsenceTypeChange={vi.fn()} onStartDateChange={vi.fn()} onEndDateChange={vi.fn()} onReasonChange={vi.fn()} onSubmit={vi.fn()} />)
    expect(markup).toContain('for="absence-type"')
    expect(markup).toContain('for="absence-start-date"')
    expect(markup).toContain('for="absence-end-date"')
    expect(markup).toContain('min="2026-07-21"')
    expect(markup).toContain('for="time-off-reason"')
    expect(markup).toContain('Pendente de aprovação')
  })

  it('permite retirar pendente sem expor controles de aprovação', () => {
    const markup = renderToStaticMarkup(<TimeOffRequestList requests={[pending]} today="2026-07-20" onRemovePending={vi.fn()} onCancelApproved={vi.fn()} />)
    expect(markup).toContain('Excluir solicitação')
    expect(markup).not.toContain('Aprovar folga')
    expect(markup).not.toContain('Rejeitar folga')
  })

  it('exibe tipo e período na lista de solicitações', () => {
    const markup = renderToStaticMarkup(<TimeOffRequestList requests={[{ ...pending, absenceType: 'Férias', startDate: '2026-07-25', endDate: '2026-07-28' }]} today="2026-07-20" onRemovePending={vi.fn()} onCancelApproved={vi.fn()} />)
    expect(markup).toContain('Férias')
    expect(markup).toContain('25 de julho de 2026 a 28 de julho de 2026')
  })

  it('diferencia visualmente todos os status sem depender apenas do texto', () => {
    const requests: TimeOffRequest[] = [
      pending,
      { ...pending, id: 'request-2', status: 'APPROVED' },
      { ...pending, id: 'request-3', status: 'REJECTED' },
      { ...pending, id: 'request-4', status: 'CANCELLED' },
    ]
    const markup = renderToStaticMarkup(<TimeOffRequestList requests={requests} today="2026-07-20" onRemovePending={vi.fn()} onCancelApproved={vi.fn()} />)

    for (const tone of ['pending', 'success', 'danger', 'cancelled']) {
      expect(markup).toContain(`data-status-tone="${tone}"`)
    }
  })
})
