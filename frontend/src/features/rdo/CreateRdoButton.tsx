import { useState } from 'react'
import { demoClients } from '../../mocks/demoData'
import { allTimeEntryActivities } from '../time-entries/domain'
import type { TimeEntryFormValues } from '../time-entries/useTimeEntryForm'
import { useSession } from '../session/useSession'
import logoUrl from '../../assets/brand/sma-logo.jpg'

export function CreateRdoButton({ values }: { values: TimeEntryFormValues }) {
  const { profile } = useSession()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const create = async (format: 'pdf' | 'word') => {
    if (busy || !profile) return
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      const { buildRdoData, generateRdo, generateRdoWord, rdoFileName, downloadRdo } = await import('./rdo')
      const data = buildRdoData({
        ...values,
        clientName: demoClients.find((client) => client.id === values.clientId)?.name,
        activityName: allTimeEntryActivities.find((activity) => activity.id === values.activityId)?.name,
        signatureBase64: profile.signatureBase64,
      }, { name: profile.name, jobTitle: profile.jobTitle })
      const response = await fetch(logoUrl)
      if (!response.ok) throw new Error('Não foi possível carregar a logo do RDO.')
      const logo = new Uint8Array(await response.arrayBuffer())
      if (format === 'pdf') {
        const pdf = generateRdo(data, logo)
        downloadRdo(pdf, rdoFileName(data))
        setFeedback('PDF gerado. O apontamento não foi salvo por esta ação.')
      } else {
        await generateRdoWord(data, logo)
        setFeedback('Word gerado. O apontamento não foi salvo por esta ação.')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o RDO. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="border-t ui-border pt-5">
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" disabled={busy || !profile} onClick={() => void create('pdf')} className="rounded-xl border ui-border px-4 py-2.5 text-sm font-bold ui-text transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60">{busy ? 'Gerando RDO…' : 'Gerar RDO (PDF)'}</button>
      <button type="button" disabled={busy || !profile} onClick={() => void create('word')} className="rounded-xl border ui-border px-4 py-2.5 text-sm font-bold ui-text transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60">{busy ? 'Gerando RDO…' : 'Gerar RDO (Word)'}</button>
    </div>
    <p className="mt-2 text-xs ui-text-subtle">Gera um RDO em PDF ou Word com os dados atuais, sem salvar o apontamento.</p>
    {error && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
    {feedback && <p role="status" className="mt-2 text-sm ui-text-muted">{feedback}</p>}
  </section>
}
