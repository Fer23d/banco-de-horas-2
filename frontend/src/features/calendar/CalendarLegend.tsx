import { calendarStatePresentation } from './presentation'
import { CalendarStateBadge } from './CalendarStateBadge'

export function CalendarLegend() {
  return (
    <div aria-label="Legenda do calendário" className="flex flex-wrap gap-2">
      {Object.keys(calendarStatePresentation).map((state) => (
        <CalendarStateBadge key={state} state={state as keyof typeof calendarStatePresentation} />
      ))}
    </div>
  )
}
