import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from './types'
import { resolveEntryDateBlock } from './entryDatePolicy'

function event(type: CalendarEvent['type'], date = '2026-07-20'): CalendarEvent {
  return {
    id: `event-${type}`, collaboratorId: 'demo-collaborator-001', type, startDate: date, endDate: date,
    title: 'Evento corporativo', source: 'DEMO', createdAt: '2026-07-01T12:00:00.000Z',
  }
}

describe('bloqueio de apontamento por evento do calendário', () => {
  it('bloqueia férias integrais com mensagem de produto', () => {
    expect(resolveEntryDateBlock('2026-07-20', [event('VACATION')])).toEqual({
      blocked: true,
      message: 'Esta data está coberta por férias integrais e não permite apontamentos.',
    })
  })

  it('bloqueia afastamento integral', () => {
    expect(resolveEntryDateBlock('2026-07-20', [event('MEDICAL_LEAVE_FULL')])).toEqual({
      blocked: true,
      message: 'Esta data está coberta por afastamento integral e não permite apontamentos.',
    })
  })

  it('bloqueia feriado integral sem exigir apontamento', () => {
    expect(resolveEntryDateBlock('2026-07-20', [event('HOLIDAY')])).toEqual({
      blocked: true,
      message: 'Esta data é um feriado integral e não exige apontamento.',
    })
  })

  it('permite afastamento parcial e jornada comum', () => {
    expect(resolveEntryDateBlock('2026-07-20', [event('MEDICAL_LEAVE_PARTIAL')])).toEqual({ blocked: false })
    expect(resolveEntryDateBlock('2026-07-20', [])).toEqual({ blocked: false })
  })

  it('ignora evento fora da data e prioriza férias sobre feriado', () => {
    expect(resolveEntryDateBlock('2026-07-20', [event('VACATION', '2026-07-19')])).toEqual({ blocked: false })
    expect(resolveEntryDateBlock('2026-07-20', [event('HOLIDAY'), event('VACATION')])).toEqual({
      blocked: true,
      message: 'Esta data está coberta por férias integrais e não permite apontamentos.',
    })
  })
})
