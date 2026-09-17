// Prerenders every content route for both languages into dist/, embeds a
// build-time score snapshot, and writes sitemap.xml, robots.txt, the root
// language redirect and 404.html.
//
// Runs after `vite build` (client) and `vite build --ssr` (renderer):
//   node scripts/prerender.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = resolve('dist')
const ssrDir = resolve('dist-ssr')
const LANGS = ['ka', 'en']

const mod = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)
const { render, staticRoutes, SPOTS, fetchWeatherForSpots, fetchMarineForSpots, scoreSpot, compactSnapshot, detailSnapshot, absoluteUrl } = mod

const base = (process.env.VITE_BASE ?? '/').replace(/\/$/, '')

/* The Vite template is dist/index.html right after `vite build`; this script
   replaces it with the root redirect, so keep a copy for re-runs. */
const templateCopy = join(ssrDir, 'template.html')
mkdirSync(ssrDir, { recursive: true })
let template = readFileSync(join(dist, 'index.html'), 'utf8')
if (template.includes('<!--app-html-->')) writeFileSync(templateCopy, template)
else if (existsSync(templateCopy)) template = readFileSync(templateCopy, 'utf8')
else throw new Error('dist/index.html is not the Vite template; run `vite build` first')

/* ---------- build-time scores ---------------------------------------- */

let results = null
let generatedAt = new Date().toISOString()
try {
  const rows = await fetchWeatherForSpots(SPOTS)
  const marine = await fetchMarineForSpots(SPOTS).catch(() => ({}))
  const now = new Date()
  generatedAt = now.toISOString()
  results = {}
  for (const w of rows) {
    const spot = SPOTS.find((s) => s.id === w.spotId)
    if (!spot) continue
    results[spot.id] = scoreSpot(spot, { ...w, marine: marine[w.spotId] }, { now })
  }
  console.log(`snapshot: ${Object.keys(results).length} spots scored at ${generatedAt}`)
} catch (e) {
  console.warn(`snapshot skipped: ${e instanceof Error ? e.message : e}`)
}

const compact = results
  ? Object.fromEntries(Object.entries(results).map(([id, r]) => [id, compactSnapshot(r)]))
  : null

// The OG generator reads this so cards show the same score as the page.
mkdirSync(ssrDir, { recursive: true })
writeFileSync(join(ssrDir, 'snapshot.json'), JSON.stringify({ generatedAt, spots: compact ?? {} }))

function snapshotFor(route) {
  if (!compact) return null
  if (route.kind === 'spots') return { generatedAt, spots: compact }
  if (route.kind === 'spot' && results[route.spotId]) {
    return { generatedAt, spots: { ...compact, [route.spotId]: detailSnapshot(results[route.spotId]) } }
  }
  return null
}

/* ---------- html assembly -------------------------------------------- */

function stripTemplateHead(html) {
  return html.replace(/<title>[\s\S]*?<\/title>\s*/, '').replace(/<meta\s+name="description"[\s\S]*?>\s*/, '')
}

function page(lang, rendered, snapshot, { prerendered = true, extraHead = '' } = {}) {
  let html = template.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
  if (rendered.head) html = stripTemplateHead(html)
  html = html
    .replace('<!--app-head-->', `${rendered.head}${extraHead}`)
    .replace('<!--app-css-->', rendered.css)
    .replace(
      '<div id="root"><!--app-html--></div>',
      prerendered ? `<div id="root" data-prerendered>${rendered.html}</div>` : '<div id="root"></div>',
    )
    .replace(
      '<!--app-snapshot-->',
      snapshot ? `<script>window.__ANKESI_SNAPSHOT__=${JSON.stringify(snapshot).replace(/</g, '\\u003c')}</script>` : '',
    )
  return html
}

function write(rel, content) {
  const file = join(dist, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

/* ---------- routes ----------------------------------------------------- */

const routes = staticRoutes()
let count = 0
const sitemap = []
const t0 = Date.now()

for (const route of routes) {
  const snapshot = snapshotFor(route)
  for (const lang of LANGS) {
    const path = `/${lang}${route.path}`
    const rendered = await render(path, lang, snapshot)
    const html = page(lang, rendered, snapshot)
    // GitHub Pages serves `/a/b` from `a/b.html` without a redirect and
    // `/a/b/` from `a/b/index.html`; write both so neither form 301s.
    write(`${path}.html`, html)
    write(`${path}/index.html`, html)
    count++
  }
  if (!route.noindex) sitemap.push(route.path)
}
console.log(`prerendered ${count} pages in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

/* ---------- 404 shell: real status code, client-side routing ----------- */

{
  const rendered = await render('/ka/__not_found__', 'ka', null)
  write(
    '404.html',
    page('ka', { ...rendered, html: '' }, null, {
      prerendered: false,
      extraHead: '\n    <meta name="robots" content="noindex" data-head>',
    }),
  )
}

/* ---------- root: redirect by saved or browser language ---------------- */

{
  const alt = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${absoluteUrl(`/${l}`)}">`).join('\n    ')
  write(
    'index.html',
    `<!doctype html>
<html lang="ka">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ანკესი · Ankesi</title>
    <link rel="canonical" href="${absoluteUrl('/ka')}">
    ${alt}
    <link rel="alternate" hreflang="x-default" href="${absoluteUrl('/ka')}">
    <meta http-equiv="refresh" content="0; url=${base}/ka">
    <script>
      (function () {
        var lang = 'ka';
        try {
          var saved = localStorage.getItem('ankesi.lang');
          if (saved === 'en' || saved === 'ka') lang = saved;
          else if ((navigator.language || '').toLowerCase().indexOf('en') === 0) lang = 'en';
        } catch (e) {}
        location.replace('${base}/' + lang + location.search + location.hash);
      })();
    </script>
  </head>
  <body>
    <p><a href="${base}/ka">ანკესი — თევზაობის პროგნოზი საქართველოში</a></p>
    <p><a href="${base}/en">Ankesi — fishing conditions in Georgia (English)</a></p>
  </body>
</html>
`,
  )
}

/* ---------- sitemap + robots ------------------------------------------ */

{
  const today = generatedAt.slice(0, 10)
  const urls = []
  for (const path of sitemap) {
    for (const lang of LANGS) {
      const links = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absoluteUrl(`/${l}${path}`)}"/>`)
      links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(`/ka${path}`)}"/>`)
      urls.push(
        `  <url>\n    <loc>${absoluteUrl(`/${lang}${path}`)}</loc>\n    <lastmod>${today}</lastmod>\n${links.join('\n')}\n  </url>`,
      )
    }
  }
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
  )
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: ${base}/*/checkout/\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`)
  console.log(`sitemap: ${urls.length} urls`)
}
