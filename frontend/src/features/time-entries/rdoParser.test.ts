import { describe, expect, it } from 'vitest'
import { parseRDOText } from './rdoParser'

describe('parser de RDO em PDF', () => {
  it('extrai número da obra, data, horas decimais e descrição do texto do RDO', () => {
    const parsed = parseRDOText(`
      Nº do QQP
      Obra 25M020E
      Data OS 28/07/2026
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      Deslocamento até a obra, reunião de segurança e levantamento de campo na área industrial.
      Total de Horas 9.0
      Assinatura do responsável
    `)

    expect(parsed).toEqual({
      numeroObra: '25M020E',
      dataApontamento: '2026-07-28',
      horas: '9',
      minutos: '0',
      detalhes: 'Deslocamento até a obra, reunião de segurança e levantamento de campo na área industrial.',
    })
  })
})
