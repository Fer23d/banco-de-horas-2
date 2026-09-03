import { useState, type ChangeEvent } from 'react'
import { demoClients } from '../../mocks/demoData'
import { activityOptionsByWorkContext } from './domain'
import { parseRDO } from './rdoParser'
import type { TimeEntryValidationErrors } from './types'
import type { TimeEntryFormValues } from './useTimeEntryForm'

const VALE_CLIENT_ID = 'client-vale'

export const fieldClassName = 'mt-2 w-full ui-field rounded-xl px-3 py-2.5 text-sm ui-text shadow-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)]'

export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null
  return <p id={id} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
}

type TimeEntryFieldsProps = {
  values: TimeEntryFormValues
  errors: TimeEntryValidationErrors
  maxDate: string
  allowBatchMode?: boolean
  onChange: <Key extends keyof TimeEntryFormValues>(field: Key, value: TimeEntryFormValues[Key]) => void
}

export function TimeEntryFields({ values, errors, maxDate, allowBatchMode = true, onChange }: TimeEntryFieldsProps) {
  const [rdoStatus, setRdoStatus] = useState<'idle' | 'reading' | 'success' | 'error'>('idle')
  const [rdoMessage, setRdoMessage] = useState<string | null>(null)
  const activityOptions = values.emObra ? activityOptionsByWorkContext.field : activityOptionsByWorkContext.corporate

  function handleWorkContextChange(emObra: boolean) {
    onChange('emObra', emObra)
    onChange('activityId', '')
    if (!emObra) onChange('numeroObra', '')
    setRdoStatus('idle')
    setRdoMessage(null)
  }

  async function handleRDOImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setRdoStatus('reading')
    setRdoMessage('Lendo PDF localmente...')
    try {
      const parsed = await parseRDO(file)
      let appliedFields = 0
      onChange('clientId', VALE_CLIENT_ID)
      appliedFields += 1
      if (parsed.numeroObra) {
        onChange('numeroObra', parsed.numeroObra)
        appliedFields += 1
      }
      if (parsed.dataInicial || parsed.dataFinal || parsed.dataApontamento) {
        const startDate = parsed.dataInicial ?? parsed.dataApontamento ?? parsed.dataFinal
        const endDate = parsed.dataFinal ?? startDate
        if (startDate) onChange('startDate', startDate)
        if (endDate) onChange('endDate', endDate)
        appliedFields += 1
      }
      if (parsed.horas !== undefined && parsed.minutos !== undefined) {
        onChange('hours', parsed.horas)
        onChange('minutes', parsed.minutos)
        appliedFields += 1
      }
      if (parsed.detalhes) {
        onChange('details', parsed.detalhes)
        appliedFields += 1
      }
      setRdoStatus(appliedFields > 0 ? 'success' : 'error')
      setRdoMessage(appliedFields > 0
        ? 'RDO lido com sucesso. Revise os campos antes de salvar.'
        : 'Não foi possível identificar dados compatíveis nesse RDO.')
    } catch (error) {
      setRdoStatus('error')
      setRdoMessage(error instanceof Error ? error.message : 'Não foi possível ler o PDF informado.')
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="entry-start-date" className="text-sm font-bold ui-text">Data Inicial</label>
            <input id="entry-start-date" name="startDate" type="date" max={maxDate} value={values.startDate} onChange={(event) => onChange('startDate', event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.entryDate)} aria-describedby={errors.entryDate ? 'entry-start-date-error' : undefined} />
            <FieldError id="entry-start-date-error" message={errors.entryDate} />
          </div>
          <div>
            <label htmlFor="entry-end-date" className="text-sm font-bold ui-text">Data Final</label>
            <input id="entry-end-date" name="endDate" type="date" min={values.startDate} max={maxDate} value={values.endDate} onChange={(event) => onChange('endDate', event.target.value)} className={fieldClassName} disabled={!allowBatchMode} />
          </div>
        </div>
        <p className="mt-2 text-xs ui-text-subtle">
          Se a data final for diferente, o sistema criará automaticamente lançamentos individuais para cada dia do período.
        </p>
        <label className={`mt-3 inline-flex items-center gap-2 text-sm font-semibold ui-text ${allowBatchMode ? '' : 'opacity-60'}`}>
          <input type="checkbox" checked={values.weekdaysOnly} onChange={(event) => onChange('weekdaysOnly', event.target.checked)} disabled={!allowBatchMode} className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-primary)]" />
          Somente dias úteis
        </label>
      </div>

      <fieldset className="md:col-span-2 rounded-2xl border ui-border ui-surface-subtle p-4">
        <legend className="px-1 text-sm font-bold ui-text">Estava em obra?</legend>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition ${values.emObra ? 'border-[var(--color-primary)] bg-[var(--color-navigation-active)] text-[var(--color-navigation-active-text)]' : 'ui-border bg-[var(--color-surface)] ui-text-muted hover:border-[var(--color-primary)]'}`}>
            <input type="radio" name="emObra" checked={values.emObra} onChange={() => handleWorkContextChange(true)} className="h-4 w-4 accent-[var(--color-primary)]" />
            Sim, estava em obra
          </label>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition ${!values.emObra ? 'border-[var(--color-primary)] bg-[var(--color-navigation-active)] text-[var(--color-navigation-active-text)]' : 'ui-border bg-[var(--color-surface)] ui-text-muted hover:border-[var(--color-primary)]'}`}>
            <input type="radio" name="emObra" checked={!values.emObra} onChange={() => handleWorkContextChange(false)} className="h-4 w-4 accent-[var(--color-primary)]" />
            Não, atividade corporativa
          </label>
        </div>
      </fieldset>

      {values.emObra && (
        <>
          <div className="md:col-span-2 rounded-2xl border ui-border ui-surface-subtle p-4">
            <label htmlFor="rdo-upload" className="text-sm font-bold ui-text">Importar arquivo RDO para preenchimento automático</label>
            <input id="rdo-upload" name="rdoUpload" type="file" accept=".pdf,application/pdf" onChange={(event) => void handleRDOImport(event)} disabled={rdoStatus === 'reading'} className={`${fieldClassName} file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#06241f] disabled:opacity-60`} />
            <p className="mt-2 text-xs ui-text-subtle">O PDF é lido apenas no navegador para preencher os campos. O arquivo não é salvo nem enviado.</p>
            {rdoMessage && (
              <p className={`mt-2 text-sm font-semibold ${rdoStatus === 'error' ? 'text-red-700 dark:text-red-300' : 'text-[var(--color-primary)]'}`} role={rdoStatus === 'error' ? 'alert' : 'status'}>
                {rdoMessage}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="work-site-number" className="text-sm font-bold ui-text">Número da obra</label>
            <input id="work-site-number" name="numeroObra" type="text" value={values.numeroObra} onChange={(event) => onChange('numeroObra', event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={fieldClassName} aria-invalid={Boolean(errors.numeroObra)} aria-describedby={errors.numeroObra ? 'work-site-number-error' : undefined} />
            <FieldError id="work-site-number-error" message={errors.numeroObra} />
          </div>
        </>
      )}

      <div>
        <label htmlFor="client" className="text-sm font-bold ui-text">Cliente</label>
        <select id="client" name="clientId" value={values.clientId} onChange={(event) => onChange('clientId', event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.clientId)} aria-describedby={errors.clientId ? 'client-error' : undefined}>
          <option value="">Selecione um cliente</option>
          {demoClients.filter((client) => client.active).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
        <FieldError id="client-error" message={errors.clientId} />
      </div>

      <div>
        <label htmlFor="project-code" className="text-sm font-bold ui-text">Número do projeto</label>
        <input id="project-code" name="projectCode" type="text" maxLength={80} value={values.projectCode} onChange={(event) => onChange('projectCode', event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={fieldClassName} aria-invalid={Boolean(errors.projectCode)} aria-describedby={errors.projectCode ? 'project-code-help project-code-error' : 'project-code-help'} />
        <p id="project-code-help" className="mt-1.5 text-xs ui-text-subtle">* Escreva exatamente a numeração do projeto atual, caso já possua.</p>
        <FieldError id="project-code-error" message={errors.projectCode} />
      </div>

      <div>
        <label htmlFor="activity" className="text-sm font-bold ui-text">Atividade realizada</label>
        <select id="activity" name="activityId" value={values.activityId} onChange={(event) => onChange('activityId', event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.activityId)} aria-describedby={errors.activityId ? 'activity-error' : undefined}>
          <option value="">Selecione uma atividade</option>
          {activityOptions.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
        </select>
        <FieldError id="activity-error" message={errors.activityId} />
      </div>

      <div>
        <label htmlFor="discipline" className="text-sm font-bold ui-text">Disciplina</label>
        <input id="discipline" name="disciplineCode" type="text" value="C – Campo" readOnly className={`${fieldClassName} font-semibold`} aria-invalid={Boolean(errors.disciplineCode)} aria-describedby={errors.disciplineCode ? 'discipline-error' : 'discipline-help'} />
        <p id="discipline-help" className="mt-1.5 text-xs ui-text-subtle">Valor fixo para apontamentos do Banco de Horas 2.</p>
        <FieldError id="discipline-error" message={errors.disciplineCode} />
      </div>
    </div>
  )
}
