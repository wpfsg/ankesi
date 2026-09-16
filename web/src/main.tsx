import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import { initTheme } from './lib/theme'
import { GlobalStyle } from './styles/GlobalStyle'
import App from './App.tsx'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyle />
    <App />
  </StrictMode>,
)
