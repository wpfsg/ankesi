// Renders an Open Graph card (1200×630 PNG) per spot and language, plus a
// default card per language, into dist/og/. Uses the local Chrome through
// puppeteer-core with the vendored fonts, so Georgian renders on CI too.
//   node scripts/og.mjs
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const dist = resolve('dist')
const ssrDir = resolve('dist-ssr')
const fonts = resolve('scripts/fonts')
const LANGS = ['ka', 'en']

const CHROME =
  process.env.CHROME_PATH ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium'].find(
    (p) => existsSync(p),
  )
if (!CHROME) {
  console.warn('og: no Chrome found (set CHROME_PATH); skipping card generation')
  process.exit(0)
}

const mod = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)
const { SPOTS, ka, en } = mod
const dict = { ka, en }
const snapshot = existsSync(join(ssrDir, 'snapshot.json')) ? JSON.parse(readFileSync(join(ssrDir, 'snapshot.json'), 'utf8')) : { spots: {} }

const BAND = {
  none: ['#5b6670', '#3f4851'],
  dead: ['#b4472b', '#7f2f1b'],
  slow: ['#d98324', '#9b5a14'],
  ok: ['#b99a1f', '#7d6712'],
  good: ['#5e9e4a', '#3e6f31'],
  great: ['#2e7d4f', '#1d5334'],
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function card({ lang, title, subtitle, score, band, date, tagline }) {
  const t = dict[lang]
  const [c1, c2] = BAND[band] ?? BAND.none
  const font = lang === 'ka' ? "'Noto Sans Georgian'" : "'Inter'"
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<style>
@font-face{font-family:'Inter';src:url('${pathToFileURL(join(fonts, 'Inter.ttf')).href}');font-weight:100 900}
@font-face{font-family:'Noto Sans Georgian';src:url('${pathToFileURL(join(fonts, 'NotoSansGeorgian.ttf')).href}');font-weight:100 900}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{font-family:${font},'Inter',sans-serif;color:#fff;background:linear-gradient(135deg,${c1},${c2});position:relative}
.glow{position:absolute;right:-160px;top:-160px;width:620px;height:620px;border-radius:50%;background:rgba(255,255,255,.10)}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px;font-size:30px;font-weight:700;letter-spacing:-.01em}
.brand span{opacity:.9}
.main{display:flex;align-items:flex-end;justify-content:space-between;gap:48px}
.text{flex:1;min-width:0}
h1{margin:0;font-size:${title.length > 26 ? 60 : 72}px;line-height:1.05;font-weight:700;letter-spacing:-.02em;text-wrap:balance}
.sub{margin-top:18px;font-size:30px;opacity:.9;font-weight:500}
.score{flex:none;text-align:center;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);border-radius:44px;padding:28px 44px;min-width:290px}
.score b{display:block;font-size:150px;line-height:1;font-weight:700;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.score small{display:block;font-size:28px;font-weight:600;margin-top:6px;opacity:.95}
.score i{display:block;font-style:normal;font-size:22px;opacity:.8;margin-top:6px}
.foot{display:flex;justify-content:space-between;font-size:24px;opacity:.85}
</style></head><body>
<div class="glow"></div>
<div class="wrap">
  <div class="brand"><svg width="52" height="52" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#fff"/><path d="M17 34c7-11 22-11 29 0-7 11-22 11-29 0z" fill="${c2}"/><circle cx="39" cy="33" r="2.4" fill="#fff"/></svg><span>${esc(t.app.title)}</span></div>
  <div class="main">
    <div class="text"><h1>${esc(title)}</h1><div class="sub">${esc(subtitle)}</div></div>
    ${
      score !== null
        ? `<div class="score"><b>${score}</b><small>${esc(t.band[band])}</small><i>${esc(t.og.today)} · ${esc(date)}</i></div>`
        : ''
    }
  </div>
  <div class="foot"><span>${esc(tagline)}</span><span>${esc(t.legend.title)}</span></div>
</div>
</body></html>`
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--allow-file-access-from-files', '--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })

async function shoot(html, file) {
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: file, type: 'png' })
}

const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Tbilisi' }).format(
  new Date(snapshot.generatedAt ?? Date.now()),
)
const t0 = Date.now()
let n = 0
for (const lang of LANGS) {
  const dir = join(dist, 'og', lang)
  mkdirSync(dir, { recursive: true })
  const t = dict[lang]
  await shoot(
    card({ lang, title: t.app.tagline, subtitle: t.seo.spots.title, score: null, band: 'great', date, tagline: t.footer.rights }),
    join(dir, 'default.png'),
  )
  n++
  for (const spot of SPOTS) {
    const s = snapshot.spots[spot.id]
    const name = lang === 'ka' ? spot.nameKa : spot.nameEn
    await shoot(
      card({
        lang,
        title: name,
        subtitle: `${t.type[spot.type]} · ${t.region[spot.region]}`,
        score: s ? s.score : null,
        band: s ? s.band : 'none',
        date,
        tagline: t.app.tagline,
      }),
      join(dir, `${spot.id}.png`),
    )
    n++
  }
}
await browser.close()
console.log(`og: ${n} cards in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
