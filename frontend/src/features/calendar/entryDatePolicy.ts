import type { CalendarEvent } from './types'

export type EntryDateBlock =
  | { blocked: false }
  | { blocked: true; message: string }

function appliesToDate(event: CalendarEvent, date: string) {
  return event.startDate <= date && event.endDate >= date
}

export function resolveEntryDateBlock(date: string, events: CalendarEvent[]): EntryDateBlock {
  const applicableEvents = events.filter((event) => appliesToDate(event, date))
  if (applicableEvents.some((event) => event.type === 'VACATION')) {
    return { blocked: true, message: 'Esta data está coberta por férias integrais e não permite apontamentos.' }
  }
  if (applicableEvents.some((event) => event.type === 'MEDICAL_LEAVE_FULL')) {
    return { blocked: true, message: 'Esta data está coberta por afastamento integral e não permite apontamentos.' }
  }
  if (applicableEvents.some((event) => event.type === 'HOLIDAY')) {
    return { blocked: true, message: 'Esta data é um feriado integral e não exige apontamento.' }
  }
  return { blocked: false }
}
