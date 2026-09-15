import { useEffect, useMemo, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { useLocation } from 'react-router-dom'
import { useSession } from '../features/session/useSession'

const TOUR_STORAGE_PREFIX = '@sma-banco2:hasSeenTour'
const collaboratorSteps: Step[] = [
  { target: '.tour-menu', title: 'Navegação principal', content: 'Use este menu para acessar calendário, apontamentos, ausências, avisos e perfil.', placement: 'right' },
  { target: '.tour-avisos', title: 'Quadro de Avisos', content: 'Consulte comunicados importantes da operação.', placement: 'right' },
  { target: '.tour-calendario', title: 'Seu calendário', content: 'Visualize o mês e interaja com os dias para consultar seus registros.', placement: 'bottom' },
  { target: '.tour-btn-apontar', title: 'Novo apontamento', content: 'Registre suas horas, projeto, atividade e detalhamento.', placement: 'bottom' },
  { target: '.tour-saldo', title: 'Seus saldos', content: 'Acompanhe horas trabalhadas e o saldo do período.', placement: 'bottom' },
]
function getConfig(role: string | undefined, pathname: string) { return role === 'COLLABORATOR' && pathname === '/colaborador' ? collaboratorSteps : [] }
export function OnboardingTour() {
  const { session } = useSession()
  const location = useLocation()
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const activeSteps = useMemo(() => getConfig(session?.role, location.pathname), [location.pathname, session?.role])
  const storageKey = session ? `${TOUR_STORAGE_PREFIX}:${session.id}:${session.role}` : null
  useEffect(() => {
    setRun(false); setSteps([])
    if (!storageKey || activeSteps.length === 0 || localStorage.getItem(storageKey)) return
    let cancelled = false
    const startedAt = Date.now()
    const wait = () => {
      if (cancelled) return
      const mounted = activeSteps.filter((step) => typeof step.target === 'string' && document.querySelector(step.target as string))
      if (mounted.length === activeSteps.length || Date.now() - startedAt >= 6000) { if (mounted.length > 0) { setSteps(mounted); setRun(true) }; return }
      window.setTimeout(wait, 100)
    }
    wait()
    return () => { cancelled = true }
  }, [activeSteps, storageKey])
  function handleCallback({ status }: EventData) {
    if (storageKey && (status === STATUS.FINISHED || status === STATUS.SKIPPED)) { localStorage.setItem(storageKey, 'true'); setRun(false) }
  }
  if (steps.length === 0) return null
  return <Joyride steps={steps} run={run} continuous scrollToFirstStep onEvent={handleCallback} locale={{ back: 'Voltar', close: 'Fechar', last: 'Concluir', next: 'Próximo', skip: 'Pular' }} options={{ showProgress: true, buttons: ['back', 'primary', 'skip'], overlayClickAction: false, spotlightPadding: 8, spotlightRadius: 16, targetWaitTimeout: 3000, arrowColor: '#132532', backgroundColor: '#132532', overlayColor: 'rgba(3, 10, 16, 0.78)', primaryColor: '#77C2A4', textColor: '#F8FAFC', zIndex: 10000 }} />
}
