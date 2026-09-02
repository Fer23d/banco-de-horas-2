import { useEffect, useId, useState } from 'react'

type RejectableItem = {
  id: string
  collaboratorName: string
}

type RejectionDialogProps = {
  entry: RejectableItem | null
  error: string | null
  isSubmitting: boolean
  title?: string
  description?: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function RejectionDialog({
  entry,
  error,
  isSubmitting,
  title = 'Rejeitar apontamento',
  description,
  onClose,
  onConfirm,
}: RejectionDialogProps) {
  const [reason, setReason] = useState('')
  const fieldId = useId()

  useEffect(() => {
    setReason('')
  }, [entry?.id])

  if (!entry) return null
  const canConfirm = reason.trim().length > 0 && !isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-6" role="presentation">
      <section
        aria-labelledby="rejection-dialog-title"
        aria-modal="true"
        className="ui-card w-full max-w-lg rounded-2xl p-5 sm:p-6"
        role="dialog"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Validação do supervisor</p>
        <h2 id="rejection-dialog-title" className="mt-2 text-xl font-extrabold text-[var(--color-text)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {description ?? `Informe o motivo para ${entry.collaboratorName}. Esse texto fica registrado na simulação local.`}
        </p>

        <label htmlFor={fieldId} className="mt-5 block text-sm font-bold text-[var(--color-text)]">
          Motivo da rejeição
        </label>
        <textarea
          id={fieldId}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="ui-field mt-2 min-h-32 w-full rounded-xl px-3 py-3 text-sm outline-none focus:ring-2"
          placeholder="Descreva o ajuste necessário antes de reenviar."
          disabled={isSubmitting}
          required
        />
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-[var(--color-danger)]">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="ui-button-secondary" disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="button" onClick={() => onConfirm(reason)} className="ui-button-danger" disabled={!canConfirm}>
            Confirmar rejeição
          </button>
        </div>
      </section>
    </div>
  )
}
