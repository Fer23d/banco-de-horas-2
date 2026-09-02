import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { resolvePublicOnlyDemoRoute } from './routePolicy'
import { useSession } from './useSession'

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession()
  const location = useLocation()
  if (isLoading) return null
  const from = (location.state as { from?: unknown } | null)?.from
  const redirect = resolvePublicOnlyDemoRoute(session, from)
  if (redirect) return <Navigate to={redirect.to} replace />
  return children
}
