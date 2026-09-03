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
      dataApontamento: '2026-07-28',
      dataInicial: '2026-07-28',
      dataFinal: '2026-07-28',
      horas: '9',
      minutos: '0',
      detalhes: '[07:30 - 12:30] Deslocamento até a obra, reunião de segurança. Organização das ferramentas, EPIs e alinhamento com a equipe local.\n\n[13:30 - 17:30] Levantamento de campo na área industrial. Registro fotográfico e conferência dos pontos de interferência.',
    })
  })

  it('extrai o intervalo mínimo e máximo quando o PDF possui múltiplas datas', () => {
    const parsed = parseRDOText(`
      Data OS 14/07/2026
      Conteúdo intermediário
      Data 12/07/2026
      Outra página do relatório
      Data OS 15/07/2026
      Data 13/07/2026
    `)

    expect(parsed.dataInicial).toBe('2026-07-12')
    expect(parsed.dataFinal).toBe('2026-07-15')
    expect(parsed.dataApontamento).toBe('2026-07-12')
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
