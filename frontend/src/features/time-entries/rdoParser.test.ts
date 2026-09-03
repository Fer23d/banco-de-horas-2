import { describe, expect, it } from 'vitest'
import { parseRDOText } from './rdoParser'

describe('parser de RDO em PDF', () => {
  it('extrai número da obra, data, horas decimais e descrição do texto do RDO', () => {
    const parsed = parseRDOText(`
      Nº do QQP
      Obra 25M020E
      Data OS 28/07/2026
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      07:30 12:30 Deslocamento até a obra, reunião de segurança.
      13:30 17:30 Levantamento de campo na área industrial.
      Total de Horas 9.0
      Assinatura do responsável
    `)

    expect(parsed).toEqual({
      numeroObra: '25M020E',
      dataApontamento: '2026-07-28',
      horas: '9',
      minutos: '0',
      detalhes: '[07:30 - 12:30] Deslocamento até a obra, reunião de segurança.\n\n[13:30 - 17:30] Levantamento de campo na área industrial.',
    })
  })

  it('captura total de horas mesmo com texto intermediário e converte fração decimal em minutos', () => {
    const parsed = parseRDOText(`
      Data 22/07/2026
      TOTAL DE HORAS
      Quantidade apontada no período
      8.5
    `)

    expect(parsed.horas).toBe('8')
    expect(parsed.minutos).toBe('30')
  })
})
