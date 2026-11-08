import './styles/main.scss'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import App from './App.tsx'
import {MotionPreferences} from './components/motion-preferences/MotionPreferences'
import {readReducedMotion} from './hooks/useMotionTheme'
import {ThemeProvider} from './components/theme-switcher/ThemeProvider'
import {applyTheme, readThemePreference} from './components/theme-switcher/theme'

applyTheme(readThemePreference())
document.documentElement.dataset.reducedMotion = String(readReducedMotion())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider><MotionPreferences><App /></MotionPreferences></ThemeProvider>
  </StrictMode>,
)
