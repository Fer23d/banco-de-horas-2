import type { FormEvent } from 'react'
import { fieldClassName } from '../time-entries/TimeEntryFields'
import type { AbsenceType } from './types'

type TimeOffRequestFormProps = {
  absenceType: AbsenceType
  startDate: string
  endDate: string
  reason: string
  minDate: string
  isSubmitting: boolean
  onAbsenceTypeChange: (absenceType: AbsenceType) => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onReasonChange: (reason: string) => void
  onSubmit: () => void
}

const absenceTypes: AbsenceType[] = ['Folga', 'Férias', 'Atestado Médico', 'Outros']

export function TimeOffRequestForm({
  absenceType,
  startDate,
  endDate,
  reason,
  minDate,
  isSubmitting,
  onAbsenceTypeChange,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onSubmit,
}: TimeOffRequestFormProps) {
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); onSubmit() }
  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border ui-border ui-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-extrabold ui-heading">Registrar ausência futura</h2>
        <p className="text-sm ui-text-subtle">A solicitação será vinculada à sua squad atual e começará como <strong>Pendente de aprovação</strong>.</p>
      </div>
      <div className="mt-5 grid gap-4">
        <div>
          <label htmlFor="absence-type" className="text-sm font-bold ui-text">Tipo de Ausência</label>
          <select id="absence-type" value={absenceType} onChange={(event) => onAbsenceTypeChange(event.target.value as AbsenceType)} className={fieldClassName} required>
            {absenceTypes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="absence-start-date" className="text-sm font-bold ui-text">Data de Início</label>
            <input id="absence-start-date" type="date" min={minDate} value={startDate} onChange={(event) => onStartDateChange(event.target.value)} className={fieldClassName} required />
          </div>
          <div>
            <label htmlFor="absence-end-date" className="text-sm font-bold ui-text">Data de Retorno</label>
            <input id="absence-end-date" type="date" min={startDate || minDate} value={endDate} onChange={(event) => onEndDateChange(event.target.value)} className={fieldClassName} required />
          </div>
        </div>
        <div>
          <label htmlFor="time-off-reason" className="text-sm font-bold ui-text">Justificativa</label>
          <textarea id="time-off-reason" rows={3} value={reason} onChange={(event) => onReasonChange(event.target.value)} className={fieldClassName} required />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={isSubmitting} className="rounded-xl ui-button-primary px-5 py-3 text-sm font-bold disabled:opacity-60">{isSubmitting ? 'Enviando…' : 'Registrar Ausência'}</button>
      </div>
    </form>
  )
}
