import { useContext } from 'react'
import { ThemeContext } from '../app/themeContext'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return context
}
