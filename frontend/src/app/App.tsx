import { HashRouter } from 'react-router-dom'
import { AppRoutes } from './AppRoutes'

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
