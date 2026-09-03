import { describe, expect, it } from 'vitest'
import { parseRDOText } from './rdoParser'

describe('parser de RDO em PDF', () => {
  it('extrai número da obra, data, horas decimais e descrição do texto do RDO', () => {
    const parsed = parseRDOText(`
      Nº do QQP
      Obra 25M020E
      Data OS 28/07/2026
      HORA DE INÍCIO
      HORA DE TÉRMINO
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      07:30 12:30 Deslocamento até a obra, reunião de segurança.
      Organização das ferramentas, EPIs e alinhamento com a equipe local.
      13:30 17:30 Levantamento de campo na área industrial.
      Registro fotográfico e conferência dos pontos de interferência.
      Total de Horas 9.0
      Assinatura do responsável
    `)

    expect(parsed).toEqual({
      numeroObra: '25M020E',
      dias: [{
        data: '2026-07-28',
        horas: 9,
        minutos: 0,
        numeroObra: '25M020E',
        detalhamento: '[07:30 - 12:30] Deslocamento até a obra, reunião de segurança. Organização das ferramentas, EPIs e alinhamento com a equipe local.\n\n[13:30 - 17:30] Levantamento de campo na área industrial. Registro fotográfico e conferência dos pontos de interferência.',
      }],
    })
  })

  it('separa múltiplas datas em apontamentos independentes', () => {
    const parsed = parseRDOText(`
      Data 12/07/2026
      HORA DE INÍCIO HORA DE TÉRMINO DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      07:30 12:30 Levantamento no campo.
      Total de Horas 5.0
      Data 13/07/2026
      HORA DE INÍCIO HORA DE TÉRMINO DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      08:00 16:30 Organização de relatórios técnicos.
      Total de Horas 8.5
    `)

    expect(parsed.dias).toHaveLength(2)
    expect(parsed.dias[0]).toMatchObject({ data: '2026-07-12', horas: 5, minutos: 0 })
    expect(parsed.dias[1]).toMatchObject({ data: '2026-07-13', horas: 8, minutos: 30 })
    expect(parsed.dias[1].detalhamento).toContain('[08:00 - 16:30] Organização de relatórios técnicos.')
  })

  it('captura total de horas mesmo com texto intermediário e converte fração decimal em minutos', () => {
    const parsed = parseRDOText(`
      Data 22/07/2026
      TOTAL DE HORAS
      Quantidade apontada no período
      8.5
    `)

    expect(parsed.dias[0]).toMatchObject({ data: '2026-07-22', horas: 8, minutos: 30 })
  })
})
