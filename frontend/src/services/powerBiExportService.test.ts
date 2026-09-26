import { describe, expect, it } from 'vitest'
import { buildPowerBiFeedUrl, toPowerBiDatasetCsv } from './powerBiExportService'

describe('powerBiExportService', () => {
  it('monta o link do feed com empresa, diretor e ciclo', () => {
    expect(buildPowerBiFeedUrl({ companyId: 'sma', directorId: 'dir-1', cycleStart: '2026-09-16', cycleEnd: '2026-10-15' }))
      .toBe('https://api.sistema.com/v1/export/powerbi?company=sma&director=dir-1&start=2026-09-16&end=2026-10-15')
  })

  it('gera um dataset CSV desnormalizado para ingestao no Power BI', () => {
    expect(toPowerBiDatasetCsv([
      {
        collaborator: 'Ana',
        supervisor: 'Supervisor 1',
        date: '2026-09-18',
        activity: 'Serviços em campo',
        project: 'P-1',
        hours: 9,
        status: 'Aprovado',
      },
    ])).toBe([
      'Nome do Colaborador;Supervisor;Data;Atividade;Projeto/Obra;Horas;Status',
      'Ana;Supervisor 1;2026-09-18;Serviços em campo;P-1;9;Aprovado',
    ].join('\r\n'))
  })
})
