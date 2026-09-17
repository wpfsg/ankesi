import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { ServerStyleSheet } from 'styled-components'
import i18n, { type Lang } from './i18n'
import { BASE } from './lib/site'
import { HeadProvider, renderHeadTags, type HeadCollector, type HeadData } from './lib/head'
import { SnapshotContext, type Snapshot } from './lib/snapshot'
import { GlobalStyle } from './styles/GlobalStyle'
import App from './App'

/* Everything scripts/prerender.mjs needs, in one module: the renderer plus
   the data and scoring functions to build the score snapshot in Node. */

export { staticRoutes } from './lib/staticRoutes'
export { SPOTS } from './data/spots'
export { SPECIES } from './data/species'
export { PLANS } from './content/pricing'
export { fetchWeatherForSpots } from './lib/weather'
export { fetchMarineForSpots } from './lib/marine'
export { scoreSpot, bandOf } from './lib/scoring'
export { compactSnapshot, detailSnapshot } from './lib/snapshot'
export { absoluteUrl } from './lib/site'
export { default as ka } from './i18n/ka'
export { default as en } from './i18n/en'

export interface Rendered {
  html: string
  /** <style> tags from styled-components. */
  css: string
  /** Title, meta, link and JSON-LD tags. */
  head: string
  headData: HeadData | null
}

async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    out += decoder.decode(value, { stream: true })
  }
  return out + decoder.decode()
}

/** Render one app path (without base) in one language. Waits for lazy page
 *  chunks so the HTML is complete, not a Suspense fallback. */
export async function render(path: string, lang: Lang, snapshot: Snapshot | null): Promise<Rendered> {
  await i18n.changeLanguage(lang)
  const sheet = new ServerStyleSheet()
  const collector: HeadCollector = { current: null }
  try {
    const { prelude } = await prerender(
      sheet.collectStyles(
        <StrictMode>
          <GlobalStyle />
          <HeadProvider value={collector}>
            <SnapshotContext.Provider value={snapshot}>
              <StaticRouter location={`${BASE}${path}`} basename={BASE || undefined}>
                <App />
              </StaticRouter>
            </SnapshotContext.Provider>
          </HeadProvider>
        </StrictMode>,
      ),
      // Inline every Suspense boundary. The default outlines boundaries over
      // ~12 kB as hidden segments revealed by a script, which crawlers and
      // the no-JS case should not have to deal with.
      { progressiveChunkSize: Number.MAX_SAFE_INTEGER },
    )
    const html = await streamToString(prelude)
    return {
      html,
      css: sheet.getStyleTags(),
      head: collector.current ? renderHeadTags(collector.current) : '',
      headData: collector.current,
    }
  } finally {
    sheet.seal()
  }
}
