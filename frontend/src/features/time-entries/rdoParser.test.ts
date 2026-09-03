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

  it('mantém os detalhamentos de múltiplas folhas vinculados aos respectivos dias', () => {
    const parsed = parseRDOText(`
      Obra 25M020E
      Data 29/07/2026
      HORA DE INÍCIO
      HORA DE TÉRMINO
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      07:30 12:30 Deslocamento SG Hotel -> Brucutu.
      Organização das ferramentas e alinhamento com a equipe local.
      Total de Horas 5.0

      Data OS 30/07/2026
      HORA DE INÍCIO
      HORA DE TÉRMINO
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      07:30 12:30 Levantamento de campo na SE-140A-01.
      Continuidade do levantamento em área externa.
      13:30 17:30 Consolidação das evidências coletadas.
      Total de Horas 9.0
    `)

    expect(parsed.dias).toHaveLength(2)
    expect(parsed.dias[0]).toMatchObject({ data: '2026-07-29', horas: 5, minutos: 0, numeroObra: '25M020E' })
    expect(parsed.dias[0].detalhamento).toContain('Organização das ferramentas')
    expect(parsed.dias[0].detalhamento).not.toContain('SE-140A-01')
    expect(parsed.dias[1]).toMatchObject({ data: '2026-07-30', horas: 9, minutos: 0, numeroObra: '25M020E' })
    expect(parsed.dias[1].detalhamento).toContain('[13:30 - 17:30] Consolidação das evidências coletadas.')
  })

  it('usa marcadores de página para separar folhas quando o PDF vem concatenado', () => {
    const parsed = parseRDOText(`
      --- Página 1 ---
      Obra 25M020E
      Data OS:
      29/07/2026
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      07:30 12:30 Atividade da primeira folha.
      Total de Horas 5.0

      --- Página 2 ---
      Obra 25M020E
      Data:
      30/07/2026
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      07:30 16:00 Atividade da segunda folha.
      Total de Horas 8.5

      --- Página 3 ---
      Obra 25M020E
      Data OS:
      31/07/2026
      DESCRIÇÃO DA ATIVIDADE E DO LOCAL
      08:00 17:00 Atividade da terceira folha.
      Total de Horas 9.0
    `)

    expect(parsed.dias).toHaveLength(3)
    expect(parsed.dias.map((day) => day.data)).toEqual(['2026-07-29', '2026-07-30', '2026-07-31'])
    expect(parsed.dias[0].detalhamento).toContain('primeira folha')
    expect(parsed.dias[0].detalhamento).not.toContain('segunda folha')
    expect(parsed.dias[2].detalhamento).toContain('terceira folha')
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
