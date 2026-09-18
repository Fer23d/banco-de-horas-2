import { describe, expect, it } from 'vitest'
import { buildRdoData } from './rdo'

describe('dados do RDO', () => {
  it('mantém horários, pausa de almoço e assinatura do profissional', () => {
    const data = buildRdoData({
      startDate: '2026-07-20',
      projectCode: 'SMA-001',
      hours: '9',
      minutes: '0',
      startTime: '07:30',
      endTime: '17:30',
      funcaoContrato: 'Categoria EAP',
      details: 'Levantamento de campo',
    }, { name: 'Rafael', jobTitle: 'Engenheiro de campo' })

    expect(data).toMatchObject({
      startTime: '07:30',
      endTime: '17:30',
      lunchBreak: '1 hora de almoço',
      professional: 'Rafael',
      category: 'Categoria EAP',
      signatureName: 'Rafael',
    })
  })

  it('calcula a duração pelos horários descontando uma hora de almoço quando horas totais estão vazias', () => {
    const data = buildRdoData({
      startDate: '2026-07-20',
      projectCode: 'SMA-001',
      hours: '',
      minutes: '',
      startTime: '07:30',
      endTime: '17:30',
      details: 'Levantamento de campo',
    }, { name: 'Rafael' })

    expect(data.duration).toBe('09:00')
  })
})
