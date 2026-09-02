import { useContext } from 'react'
import { SessionContext } from './sessionContext'

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession deve ser usado dentro de DemoSessionProvider')
  return context
}
