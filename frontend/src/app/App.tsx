import { HashRouter } from 'react-router-dom'
import { AppRoutes } from './AppRoutes'
import { OnboardingTour } from '../components/OnboardingTour'

export function App() {
  return (
    <HashRouter>
      <OnboardingTour />
      <AppRoutes />
    </HashRouter>
  )
}
