import { describe, expect, it } from 'vitest'
import { buildReportRows, toReportCsv, type ReportRow } from '../services/reportService'

describe('RelatoriosPage', () => {
  it('agrega apenas os apontamentos do ciclo e relaciona a supervisão', () => {
    const rows = buildReportRows([
      { id: '1', collaboratorId: 'c1', collaboratorName: 'Ana', entryDate: '2026-09-18', projectCode: 'P-1', durationMinutes: 540, status: 'APPROVED', emObra: true, activityName: 'Serviços em campo' },
      { id: '2', collaboratorId: 'c1', collaboratorName: 'Ana', entryDate: '2026-09-15', projectCode: 'P-1', durationMinutes: 480, status: 'PENDING', emObra: false, activityName: 'Escritório' },
    ], [{ id: 'c1', name: 'Ana', supervisorId: 's1' }], [{ id: 's1', name: 'Supervisor 1' }], '2026-09-16', '2026-10-15')

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ collaborator: 'Ana', supervisor: 'Supervisor 1', project: 'P-1', hours: 9, emObra: true })
  })

  it('gera CSV com cabeçalho operacional e status legível', () => {
    const rows: ReportRow[] = [{ id: '1', collaborator: 'Ana', supervisor: 'Supervisor 1', date: '2026-09-18', activity: 'Serviços em campo', project: 'P-1', hours: 9, status: 'APPROVED', durationMinutes: 540, emObra: true }]

    expect(toReportCsv(rows)).toBe([
      '"Nome do Colaborador";"Supervisor";"Data";"Atividade";"Projeto/Obra";"Horas";"Status"',
      '"Ana";"Supervisor 1";"2026-09-18";"Serviços em campo";"P-1";"9";"Aprovado"',
    ].join('\r\n'))
  })
})
