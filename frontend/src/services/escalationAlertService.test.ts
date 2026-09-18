import { describe, expect, it } from 'vitest'
import { getEscalationAlerts } from './escalationAlertService'

const cycle = { startDate: '2026-08-16', endDate: '2026-09-15' }
const entry = (date: string) => ({ collaboratorId: 'collaborator-1', entryDate: date, status: 'ACTIVE' as const })

describe('alertas escalonados do ciclo 16-15', () => {
  it('entrega alerta amarelo no fechamento somente ao colaborador', () => {
    const alerts = getEscalationAlerts({ today: '2026-09-15', cycle, entries: [entry('2026-09-14')], collaboratorId: 'collaborator-1', recipientRole: 'COLLABORATOR' })
    expect(alerts[0]).toMatchObject({ level: 'YELLOW', recipients: ['COLLABORATOR'] })
    expect(alerts[0].missingDates).toContain('2026-09-15')
    expect(getEscalationAlerts({ today: '2026-09-15', cycle, entries: [entry('2026-09-14')], collaboratorId: 'collaborator-1', recipientRole: 'SUPERVISOR' })).toEqual([])
  })

  it('escala no dia 18 para supervisão e no dia 22 para direção', () => {
    expect(getEscalationAlerts({ today: '2026-09-18', cycle, entries: [entry('2026-09-14')], collaboratorId: 'collaborator-1', recipientRole: 'SUPERVISOR' })[0].level).toBe('ORANGE')
    expect(getEscalationAlerts({ today: '2026-09-22', cycle, entries: [entry('2026-09-14')], recipientRole: 'DIRECTOR_ADMIN' })[0].level).toBe('RED')
  })

  it('considera somente dias úteis sem duplicar dias com apontamento', () => {
    const alerts = getEscalationAlerts({ today: '2026-09-22', cycle, entries: [entry('2026-08-17'), entry('2026-08-18')], collaboratorId: 'collaborator-1', recipientRole: 'COLLABORATOR' })
    expect(alerts[0].missingDates).not.toContain('2026-08-16')
    expect(alerts[0].missingDates).not.toContain('2026-08-17')
    expect(alerts[0].missingDates).toContain('2026-08-19')
  })
})
