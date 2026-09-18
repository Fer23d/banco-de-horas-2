import { useEffect, useState } from 'react'
import { supervisorService } from '../../services/supervisorService'
import { timeEntryService } from '../../services/timeEntryService'
import { getEscalationAlerts, type EscalationAlert } from '../../services/escalationAlertService'
import { getCorporateToday, getTimesheetCycle } from '../../shared/utils/date'
import { useSession } from '../session/useSession'

export function useEscalationAlerts() {
  const { session } = useSession()
  const [alerts, setAlerts] = useState<EscalationAlert[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!session) {
        setAlerts([])
        return
      }
      const today = getCorporateToday()
      const cycle = getTimesheetCycle(today)
      const entries = session.role === 'COLLABORATOR'
        ? await timeEntryService.listByRange(session.id, cycle.startDate, cycle.endDate)
        : await supervisorService.listEntries()
      const next = getEscalationAlerts({ today, cycle, entries, collaboratorId: session.role === 'COLLABORATOR' ? session.id : undefined, recipientRole: session.role })
      if (!cancelled) setAlerts(next)
    }
    void load().catch(() => { if (!cancelled) setAlerts([]) })
    return () => { cancelled = true }
  }, [session])

  return alerts
}
