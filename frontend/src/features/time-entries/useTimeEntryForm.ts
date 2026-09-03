import { useCallback, useEffect, useState } from 'react'
import { demoActivities, demoClients } from '../../mocks/demoData'
import { entryDateAvailabilityService } from '../../services/entryDateAvailabilityService'
import { timeEntryService } from '../../services/timeEntryService'
import type { ParsedRDODay } from './rdoParser'
import type { CreateTimeEntryData, TimeEntry, TimeEntryValidationErrors } from './types'
import { expandTimeEntryDates } from './domain'
import { getCorporateToday, isIsoDate } from '../../shared/utils/date'
import { useSession } from '../session/useSession'
import { areValidDurationParts, hoursAndMinutesToMinutes, validateTimeEntry } from './domain'

export type TimeEntryFormValues = {
  startDate: string
  endDate: string
  weekdaysOnly: boolean
  emObra: boolean
  numeroObra: string
  clientId: string
  projectCode: string
  activityId: string
  disciplineCode: CreateTimeEntryData['disciplineCode'] | ''
  hours: string
  minutes: string
  details: string
  editReason: string
}

const emptyValues = (entryDate: string): TimeEntryFormValues => ({
  startDate: entryDate,
  endDate: entryDate,
  weekdaysOnly: true,
  emObra: false,
  numeroObra: '',
  clientId: '',
  projectCode: '',
  activityId: '',
  disciplineCode: 'C',
  hours: '',
  minutes: '',
  details: '',
  editReason: '',
})

function valuesFromEntry(entry: TimeEntry): TimeEntryFormValues {
  return {
    startDate: entry.entryDate,
    endDate: entry.entryDate,
    weekdaysOnly: true,
    emObra: entry.emObra,
    numeroObra: entry.numeroObra ?? '',
    clientId: entry.clientId,
    projectCode: entry.projectCode,
    activityId: entry.activityId,
    disciplineCode: 'C',
    hours: String(Math.floor(entry.durationMinutes / 60)),
    minutes: String(entry.durationMinutes % 60),
    details: entry.details,
    editReason: '',
  }
}

type FormMode = 'CREATE' | 'EDIT' | 'DUPLICATE'

export function useTimeEntryForm({ initialDate, entryId, duplicateId }: { initialDate: string; entryId?: string; duplicateId?: string }) {
  const { profile } = useSession()
  const mode: FormMode = entryId ? 'EDIT' : duplicateId ? 'DUPLICATE' : 'CREATE'
  const sourceId = entryId ?? duplicateId
  const [source, setSource] = useState<TimeEntry | null>(null)
  const [values, setValues] = useState<TimeEntryFormValues>(() => emptyValues(initialDate))
  const [errors, setErrors] = useState<TimeEntryValidationErrors>({})
  const [editReasonError, setEditReasonError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(sourceId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [extractedRdoDays, setExtractedRdoDays] = useState<ParsedRDODay[]>([])

  useEffect(() => {
    if (!profile || !sourceId) return
    let active = true
    setIsLoading(true)
    timeEntryService.getById(profile.id, sourceId)
      .then((entry) => {
        if (!active) return
        if (!entry) {
          setSubmitError('O apontamento solicitado não foi encontrado.')
          return
        }
        setSource(entry)
        setValues(valuesFromEntry(entry))
      })
      .catch(() => active && setSubmitError('Não foi possível carregar o apontamento.'))
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [profile, sourceId])

  const setField = useCallback(<Key extends keyof TimeEntryFormValues>(field: Key, value: TimeEntryFormValues[Key]) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (field === 'editReason') setEditReasonError(null)
    else setErrors((current) => ({ ...current, [field]: undefined }))
  }, [])

  const submit = async () => {
    if (!profile || isSubmitting) return false
    setSubmitError(null)
    setSuccessMessage(null)
    const durationHours = Number(values.hours || 0)
    const durationRemainderMinutes = Number(values.minutes || 0)
    const hasExtractedRdoDays = mode === 'CREATE' && extractedRdoDays.length > 0
    const firstExtractedDay = extractedRdoDays[0]
    const effectiveStartDate = hasExtractedRdoDays ? firstExtractedDay.data : values.startDate
    const effectiveEndDate = hasExtractedRdoDays ? firstExtractedDay.data : mode === 'CREATE' ? values.endDate : values.startDate
    const effectiveWeekdaysOnly = hasExtractedRdoDays ? false : mode === 'CREATE' ? values.weekdaysOnly : true
    const periodDates = mode === 'CREATE' && !hasExtractedRdoDays
      ? expandTimeEntryDates(values.startDate, effectiveEndDate, effectiveWeekdaysOnly)
      : [values.startDate]
    const data: CreateTimeEntryData = {
      entryDate: effectiveStartDate,
      endDate: effectiveEndDate,
      weekdaysOnly: effectiveWeekdaysOnly,
      emObra: values.emObra,
      numeroObra: values.emObra ? values.numeroObra : undefined,
      clientId: values.clientId,
      projectCode: values.emObra ? values.numeroObra : values.projectCode,
      activityId: values.activityId,
      disciplineCode: 'C',
      durationMinutes: hasExtractedRdoDays
        ? hoursAndMinutesToMinutes(firstExtractedDay.horas, firstExtractedDay.minutos)
        : hoursAndMinutesToMinutes(durationHours, durationRemainderMinutes),
      details: hasExtractedRdoDays ? firstExtractedDay.detalhamento : values.details,
    }
    let dateBlock = { blocked: false } as Awaited<ReturnType<typeof entryDateAvailabilityService.getBlock>>
    if (isIsoDate(data.entryDate)) {
      try {
        dateBlock = await entryDateAvailabilityService.getBlock(profile.id, data.entryDate)
      } catch {
        setSubmitError('Não foi possível verificar os eventos desta data. Tente novamente.')
        return false
      }
    }
    const validationErrors = validateTimeEntry(data, demoClients, demoActivities, { today: getCorporateToday() })
    if (dateBlock.blocked) validationErrors.entryDate = dateBlock.message
    if (!areValidDurationParts(durationHours, durationRemainderMinutes)) {
      validationErrors.durationMinutes = 'Informe horas inteiras entre 0 e 24 e minutos inteiros entre 0 e 59, com total máximo de 24 horas.'
    }
    if (mode === 'CREATE') {
      if (hasExtractedRdoDays) {
        const invalidExtractedDay = extractedRdoDays.find((day) => !isIsoDate(day.data) || !day.detalhamento.trim() || !areValidDurationParts(day.horas, day.minutos))
        if (invalidExtractedDay) {
          setSubmitError('O RDO possui um ou mais dias com data, duração ou detalhamento inválido.')
          return false
        }
      } else if (!isIsoDate(values.endDate)) {
        validationErrors.endDate = 'Informe uma data final válida.'
      } else if (values.endDate < values.startDate) {
        validationErrors.endDate = 'A data final deve ser igual ou posterior à data inicial.'
      } else if (values.startDate !== values.endDate && periodDates.length === 0) {
        setSubmitError('O período selecionado não contém dias úteis para lançamento.')
        return false
      }
    }
    const reasonError = mode === 'EDIT' && !values.editReason.trim() ? 'Informe o motivo da edição.' : null
    setErrors(validationErrors)
    setEditReasonError(reasonError)
    if (Object.keys(validationErrors).length > 0 || reasonError) return false
    if ((mode === 'EDIT' || mode === 'DUPLICATE') && !source) {
      setSubmitError('O apontamento de origem não está disponível.')
      return false
    }

    setIsSubmitting(true)
    try {
      if (mode === 'EDIT' && source) {
        const updated = await timeEntryService.update(profile.id, source.id, source.version, data, values.editReason)
        setSource(updated)
        setValues(valuesFromEntry(updated))
        setSuccessMessage('Apontamento atualizado com sucesso.')
      } else if (mode === 'DUPLICATE' && source) {
        await timeEntryService.duplicate(profile.id, source.id, source.version, data)
        setSuccessMessage('Apontamento duplicado com sucesso.')
      } else {
        if (hasExtractedRdoDays) {
          await Promise.all(extractedRdoDays.map((day) => timeEntryService.create(profile.id, {
            ...data,
            entryDate: day.data,
            endDate: day.data,
            weekdaysOnly: false,
            numeroObra: values.numeroObra || day.numeroObra,
            projectCode: values.numeroObra || day.numeroObra,
            durationMinutes: hoursAndMinutesToMinutes(day.horas, day.minutos),
            details: day.detalhamento,
          })))
          setSuccessMessage(`${extractedRdoDays.length} lançamentos do RDO salvos individualmente com sucesso.`)
        } else {
          await timeEntryService.create(profile.id, data)
          setSuccessMessage(periodDates.length > 1
            ? `${periodDates.length} lançamentos salvos com sucesso para o período selecionado.`
            : 'Apontamento salvo com sucesso.')
        }
      }
      setErrors({})
      setEditReasonError(null)
      if (mode !== 'EDIT') {
        setValues(emptyValues(data.entryDate))
        setExtractedRdoDays([])
      }
      return true
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível salvar o apontamento localmente.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    mode,
    values,
    errors,
    editReasonError,
    isLoading,
    isSubmitting,
    submitError,
    successMessage,
    extractedRdoDays,
    setField,
    setExtractedRdoDays,
    submit,
  }
}
