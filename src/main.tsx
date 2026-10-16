import './styles/main.scss'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import App from './App.tsx'
import {MotionConfig} from 'framer-motion'
import {ThemeProvider} from './components/theme-switcher/ThemeProvider'
import {applyTheme, readThemePreference} from './components/theme-switcher/theme'

applyTheme(readThemePreference())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider><MotionConfig reducedMotion="user"><App /></MotionConfig></ThemeProvider>
  </StrictMode>,
)
