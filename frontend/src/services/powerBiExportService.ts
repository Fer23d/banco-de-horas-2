export type PowerBiFeedParams = {
  companyId: string
  directorId: string
  cycleStart: string
  cycleEnd: string
}

export type PowerBiDatasetRow = {
  collaborator: string
  supervisor: string
  date: string
  activity: string
  project: string
  hours: number
  status: string
}

const POWER_BI_API_BASE = 'https://api.sistema.com/v1/export/powerbi'

export function buildPowerBiFeedUrl({ companyId, directorId, cycleStart, cycleEnd }: PowerBiFeedParams) {
  const query = new URLSearchParams({
    company: companyId,
    director: directorId,
    start: cycleStart,
    end: cycleEnd,
  })
  return `${POWER_BI_API_BASE}?${query.toString()}`
}

function escapeCsv(value: string | number) {
  return String(value).replaceAll('"', '""')
}

export function toPowerBiDatasetCsv(rows: PowerBiDatasetRow[]) {
  const header = ['Nome do Colaborador', 'Supervisor', 'Data', 'Atividade', 'Projeto/Obra', 'Horas', 'Status']
  const lines = rows.map((row) => [
    row.collaborator,
    row.supervisor,
    row.date,
    row.activity,
    row.project,
    row.hours.toString().replace('.', ','),
    row.status,
  ])
  return [header, ...lines].map((line) => line.map(escapeCsv).join(';')).join('\r\n')
}
