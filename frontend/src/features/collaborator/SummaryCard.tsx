type SummaryCardProps = {
  label: string
  value: string
  helper: string
  tone?: 'neutral' | 'positive' | 'warning'
}

export function SummaryCard({ label, value, helper, tone = 'neutral' }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border ui-border ui-surface p-5 shadow-sm" data-summary-tone={tone}>
      <p className="text-xs font-bold uppercase tracking-wider ui-text-subtle">{label}</p>
      <p className="mt-3 text-3xl font-extrabold ui-heading">{value}</p>
      <p className="mt-2 text-sm ui-text-muted">{helper}</p>
    </article>
  )
}
