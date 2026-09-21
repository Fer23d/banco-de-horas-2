import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageContainer } from '../components/PageContainer'
import { buildReportRows, toReportCsv, type ReportRow } from '../services/reportService'
import { supervisorService } from '../services/supervisorService'
import { getCorporateToday, getTimesheetCycle } from '../shared/utils/date'

type ReportStatusLabel = 'Aprovado' | 'Pendente' | 'Rejeitado'

const statusLabel: Record<ReportRow['status'], ReportStatusLabel> = {
  APPROVED: 'Aprovado',
  PENDING: 'Pendente',
  REJECTED: 'Rejeitado',
}

const chartColors = ['#77C2A4', '#8AB7C7']

const fallbackRows: ReportRow[] = [
  { id: 'report-demo-1', collaborator: 'Colaborador', supervisor: 'Jeen Carlos E. Azevedo', date: '2026-09-18', activity: 'Serviços em campo', project: 'SM&A-ENG-142', hours: 9, status: 'APPROVED', durationMinutes: 540, emObra: true },
  { id: 'report-demo-2', collaborator: 'Marina Costa', supervisor: 'Jeen Carlos E. Azevedo', date: '2026-09-19', activity: 'Elaboração de projeto', project: 'SM&A-AUT-087', hours: 8, status: 'PENDING', durationMinutes: 480, emObra: false },
  { id: 'report-demo-3', collaborator: 'Rafael Almeida', supervisor: 'Jeen Carlos E. Azevedo', date: '2026-09-20', activity: 'Levantamento de campo', project: 'SM&A-ELE-211', hours: 8.5, status: 'REJECTED', durationMinutes: 510, emObra: true },
]

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1).replace('.', ',')}h`
}

function downloadCsv(rows: ReportRow[]) {
  const blob = new Blob([`\uFEFF${toReportCsv(rows)}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `relatorio_horas_${getCorporateToday()}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function RelatoriosPage() {
  const cycle = useMemo(() => getTimesheetCycle(getCorporateToday()), [])
  const [rows, setRows] = useState<ReportRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([supervisorService.listEntries(), supervisorService.listCollaborators(), supervisorService.listSupervisors()])
      .then(([entries, collaborators, supervisors]) => {
        if (!active) return
        const loadedRows = buildReportRows(entries, collaborators, supervisors, cycle.startDate, cycle.endDate)
        setRows(loadedRows.length > 0 ? loadedRows : fallbackRows)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        console.error('Não foi possível carregar o relatório.', error)
        if (!active) return
        setRows(fallbackRows)
        setLoadError('Não foi possível carregar os dados reais. Exibindo dados de referência.')
        setIsLoading(false)
      })
    return () => { active = false }
  }, [cycle.endDate, cycle.startDate])

  const fieldHours = useMemo(() => rows.filter((row) => row.emObra).reduce((total, row) => total + row.durationMinutes, 0), [rows])
  const officeHours = useMemo(() => rows.filter((row) => !row.emObra).reduce((total, row) => total + row.durationMinutes, 0), [rows])
  const totalHours = fieldHours + officeHours
  const fieldOfficeData = useMemo(() => [
    { name: 'Horas em campo', value: fieldHours },
    { name: 'Escritório / outros', value: officeHours },
  ], [fieldHours, officeHours])
  const approvalData = useMemo(() => {
    const grouped = new Map<string, { supervisor: string; Aprovado: number; Pendente: number; Rejeitado: number }>()
    for (const row of rows) {
      const current = grouped.get(row.supervisor) ?? { supervisor: row.supervisor, Aprovado: 0, Pendente: 0, Rejeitado: 0 }
      current[statusLabel[row.status]] += 1
      grouped.set(row.supervisor, current)
    }
    return Array.from(grouped.values())
  }, [rows])
  const pendingCount = rows.filter((row) => row.status === 'PENDING').length
  const overtimeHours = rows.reduce((total, row) => total + Math.max(0, row.durationMinutes - 480), 0)

  return (
    <PageContainer title="Relatórios" description="Indicadores consolidados de horas, operação e aprovações da Diretoria." contained={false}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border ui-border ui-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Ciclo analisado</p>
            <p className="mt-1 font-bold ui-text">{cycle.startDate} a {cycle.endDate}</p>
            {loadError && <p className="mt-2 text-sm font-semibold text-amber-600">{loadError}</p>}
          </div>
          <button type="button" onClick={() => downloadCsv(rows)} disabled={isLoading || rows.length === 0} className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60">Exportar Relatório (CSV)</button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores do relatório">
          <article className="rounded-2xl border ui-border ui-surface p-5"><p className="text-xs font-bold uppercase tracking-wider ui-text-subtle">Horas da operação</p><p className="mt-3 text-3xl font-extrabold ui-heading">{formatHours(totalHours)}</p></article>
          <article className="rounded-2xl border ui-border ui-surface p-5"><p className="text-xs font-bold uppercase tracking-wider ui-text-subtle">Horas extras estimadas</p><p className="mt-3 text-3xl font-extrabold ui-heading">{formatHours(overtimeHours)}</p></article>
          <article className="rounded-2xl border ui-border ui-surface p-5"><p className="text-xs font-bold uppercase tracking-wider ui-text-subtle">Horas em campo</p><p className="mt-3 text-3xl font-extrabold ui-heading">{formatHours(fieldHours)}</p></article>
          <article className="rounded-2xl border ui-border ui-surface p-5"><p className="text-xs font-bold uppercase tracking-wider ui-text-subtle">Pendentes</p><p className="mt-3 text-3xl font-extrabold ui-heading">{pendingCount}</p></article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2" aria-label="Gráficos analíticos">
          <article className="min-h-[380px] rounded-2xl border ui-border ui-surface p-5">
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Distribuição</p><h2 className="mt-1 text-xl font-extrabold ui-text">Horas em campo vs. escritório</h2></div>
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fieldOfficeData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={62} outerRadius={100} paddingAngle={3}>
                    {fieldOfficeData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatHours(Number(value ?? 0))} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="min-h-[380px] rounded-2xl border ui-border ui-surface p-5">
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Aprovações</p><h2 className="mt-1 text-xl font-extrabold ui-text">Status por Supervisor</h2></div>
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalData} margin={{ top: 8, right: 8, left: 0, bottom: 36 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="supervisor" angle={-22} textAnchor="end" interval={0} height={55} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }} />
                  <Legend />
                  <Bar dataKey="Aprovado" fill="#77C2A4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pendente" fill="#C9A66B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rejeitado" fill="#C99393" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border ui-border ui-surface p-5" aria-labelledby="report-base-title">
          <div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Base analítica</p><h2 id="report-base-title" className="mt-1 text-xl font-extrabold ui-text">Apontamentos do ciclo</h2></div><span className="text-sm ui-text-muted">{rows.length} registro(s)</span></div>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b ui-border text-xs uppercase tracking-wider ui-text-subtle"><tr>{['Colaborador', 'Supervisor', 'Data', 'Atividade', 'Projeto/Obra', 'Horas', 'Status'].map((header) => <th key={header} className="px-3 py-3 font-bold">{header}</th>)}</tr></thead><tbody className="divide-y ui-border">{rows.map((row) => <tr key={row.id}><td className="px-3 py-3 font-semibold ui-text">{row.collaborator}</td><td className="px-3 py-3 ui-text-muted">{row.supervisor}</td><td className="px-3 py-3 ui-text-muted">{row.date}</td><td className="px-3 py-3 ui-text-muted">{row.activity}</td><td className="px-3 py-3 ui-text-muted">{row.project}</td><td className="px-3 py-3 ui-text">{row.hours.toFixed(2).replace('.', ',')}h</td><td className="px-3 py-3 font-bold ui-text">{statusLabel[row.status]}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </PageContainer>
  )
}
