import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './i18n'
import { initTheme } from './lib/theme'
import { BASE } from './lib/site'
import { appPath } from './i18n'
import { stripLang } from './lib/routes'
import { readSnapshot, SnapshotContext } from './lib/snapshot'
import { markHydrating } from './lib/hydration'
import { GlobalStyle } from './styles/GlobalStyle'
import App from './App.tsx'

initTheme()

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <GlobalStyle />
    <SnapshotContext.Provider value={readSnapshot()}>
      <BrowserRouter basename={BASE || undefined}>
        <App />
      </BrowserRouter>
    </SnapshotContext.Provider>
  </StrictMode>
)

// Prerendered pages carry data-prerendered and are hydrated in place. The
// map route's prerendered shell is only a placeholder for the lazy map, so
// it is replaced rather than hydrated; the 404 shell and the dev server
// start from an empty root.
const isMapRoute = stripLang(appPath(window.location.pathname)) === ''
if (container.dataset.prerendered !== undefined && container.hasChildNodes() && !isMapRoute) {
  markHydrating(true)
  hydrateRoot(container, app)
} else {
  container.replaceChildren()
  createRoot(container).render(app)
}
