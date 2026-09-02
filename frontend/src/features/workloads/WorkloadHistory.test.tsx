import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { WorkloadChangeRequest } from './types'
import { WorkloadHistory } from './WorkloadHistory'

const request: WorkloadChangeRequest = {
  id: 'workload-1',
  collaboratorId: 'collaborator-1',
  requestedDailyMinutes: 480,
  requestedEffectiveFrom: '2026-08-01',
  justification: 'Ajuste corporativo',
  status: 'PENDING',
  assignmentSnapshot: null,
  createdAt: '2026-07-20T12:00:00.000Z',
  updatedAt: '2026-07-20T12:00:00.000Z',
}

describe('histórico de solicitações de carga', () => {
  it('diferencia pendente, aprovada, rejeitada e cancelada', () => {
    const requests: WorkloadChangeRequest[] = [
      request,
      { ...request, id: 'workload-2', status: 'APPROVED' },
      { ...request, id: 'workload-3', status: 'REJECTED' },
      { ...request, id: 'workload-4', status: 'CANCELLED' },
    ]
    const markup = renderToStaticMarkup(<WorkloadHistory versions={[]} requests={requests} />)

    for (const tone of ['pending', 'success', 'danger', 'cancelled']) {
      expect(markup).toContain(`data-status-tone="${tone}"`)
    }
  })
})
