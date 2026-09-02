import { demoActivities, demoClients } from '../../mocks/demoData'
import { fieldClassName } from '../time-entries/TimeEntryFields'
import type { HistoryFiltersValue } from './useTimeEntryHistory'

export function HistoryFilters({ value, onChange, onApply }: { value: HistoryFiltersValue; onChange: (value: HistoryFiltersValue) => void; onApply: () => void }) {
  const set = <Key extends keyof HistoryFiltersValue>(key: Key, next: HistoryFiltersValue[Key]) => onChange({ ...value, [key]: next })
  return (
    <form onSubmit={(event) => { event.preventDefault(); onApply() }} className="grid gap-4 rounded-2xl border ui-border ui-surface p-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Filtros do histórico">
      <div>
        <label htmlFor="history-mode" className="text-sm font-bold ui-text">Período</label>
        <select id="history-mode" value={value.mode} onChange={(event) => set('mode', event.target.value as HistoryFiltersValue['mode'])} className={fieldClassName}>
          <option value="MONTH">Mês</option><option value="DAY">Dia específico</option><option value="RANGE">Intervalo</option><option value="ALL">Todos disponíveis</option>
        </select>
      </div>
      {value.mode === 'MONTH' && <div><label htmlFor="history-month" className="text-sm font-bold ui-text">Mês</label><input id="history-month" type="month" value={value.month} onChange={(event) => set('month', event.target.value)} className={fieldClassName} /></div>}
      {value.mode === 'DAY' && <div><label htmlFor="history-day" className="text-sm font-bold ui-text">Data</label><input id="history-day" type="date" value={value.day} onChange={(event) => set('day', event.target.value)} className={fieldClassName} /></div>}
      {value.mode === 'RANGE' && <><div><label htmlFor="history-start" className="text-sm font-bold ui-text">Data inicial</label><input id="history-start" type="date" value={value.startDate} onChange={(event) => set('startDate', event.target.value)} className={fieldClassName} /></div><div><label htmlFor="history-end" className="text-sm font-bold ui-text">Data final</label><input id="history-end" type="date" value={value.endDate} onChange={(event) => set('endDate', event.target.value)} className={fieldClassName} /></div></>}
      <div><label htmlFor="history-client" className="text-sm font-bold ui-text">Cliente</label><select id="history-client" value={value.clientId} onChange={(event) => set('clientId', event.target.value)} className={fieldClassName}><option value="">Todos</option>{demoClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
      <div><label htmlFor="history-project" className="text-sm font-bold ui-text">Número do projeto</label><input id="history-project" value={value.projectCode} onChange={(event) => set('projectCode', event.target.value)} className={fieldClassName} /></div>
      <div><label htmlFor="history-activity" className="text-sm font-bold ui-text">Atividade</label><select id="history-activity" value={value.activityId} onChange={(event) => set('activityId', event.target.value)} className={fieldClassName}><option value="">Todas</option>{demoActivities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}</select></div>
      <div><label htmlFor="history-discipline" className="text-sm font-bold ui-text">Disciplina</label><select id="history-discipline" value={value.disciplineCode} onChange={(event) => set('disciplineCode', event.target.value as HistoryFiltersValue['disciplineCode'])} className={fieldClassName}><option value="">Todas</option><option value="—">Não se aplica</option><option value="A">Automação</option><option value="E">Elétrica</option></select></div>
      <div><label htmlFor="history-document-type" className="text-sm font-bold ui-text">Tipo de documento</label><select id="history-document-type" value={value.documentTypeCode} onChange={(event) => set('documentTypeCode', event.target.value as HistoryFiltersValue['documentTypeCode'])} className={fieldClassName}><option value="">Todos</option>{['—', 'RN', 'GR', 'G', 'FD', 'DE', 'LM', 'DI', 'LC', 'LI', 'ET', 'MC', 'MO', 'MD', 'FG', 'LA', 'ES', 'CF'].map((code) => <option key={code} value={code}>{code === '—' ? 'Não se aplica' : code}</option>)}</select></div>
      <div><label htmlFor="history-status" className="text-sm font-bold ui-text">Situação do apontamento</label><select id="history-status" value={value.status} onChange={(event) => set('status', event.target.value as HistoryFiltersValue['status'])} className={fieldClassName}><option value="ACTIVE">Somente ativos</option><option value="CANCELLED">Somente cancelados</option><option value="ALL">Todos</option></select></div>
      <div className="flex items-end"><button type="submit" className="w-full rounded-xl ui-button-primary px-4 py-3 text-sm font-bold">Aplicar filtros</button></div>
    </form>
  )
}
