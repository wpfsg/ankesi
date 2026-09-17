// Screenshots of every content route at phone and desktop widths against a
// running server (default: `vite preview` on :4173), and a list of console
// errors and failed requests per page.
//   node scripts/shots.mjs [baseUrl] [outDir]
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'

const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '')
const out = process.argv[3] ?? 'shots'
mkdirSync(out, { recursive: true })

const CHROME =
  process.env.CHROME_PATH ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))

const PAGES = [
  ['map', '/ka'],
  ['spots', '/ka/spots'],
  ['spot-lopota', '/ka/spots/lopota-lake'],
  ['spot-batumi-en', '/en/spots/batumi-pier'],
  ['how', '/ka/how-it-works'],
  ['faq', '/en/faq'],
  ['pricing', '/ka/pricing'],
  ['checkout', '/en/checkout/annual'],
  ['reports', '/ka/reports'],
  ['404', '/404.html'],
]
const VIEWPORTS = [
  ['390', { width: 390, height: 844, deviceScaleFactor: 2 }],
  ['1440', { width: 1440, height: 900, deviceScaleFactor: 1 }],
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars'],
})

const problems = []
for (const [vpName, vp] of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewport(vp)
  let current = ''
  page.on('pageerror', (e) => problems.push(`${vpName} ${current} pageerror: ${e.message.slice(0, 200)}`))
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${vpName} ${current} console.error: ${m.text().slice(0, 300)}`)
  })
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('open-meteo') && !r.url().endsWith('/404.html')) problems.push(`${vpName} ${current} http ${r.status()}: ${r.url()}`)
  })
  for (const [name, path] of PAGES) {
    current = name
    const res = await page.goto(`${base}${path}`, { waitUntil: 'load', timeout: 45_000 }).catch((e) => {
      problems.push(`${vpName} ${name}: ${e.message}`)
      return null
    })
    if (!res) continue
    await new Promise((r) => setTimeout(r, name === 'map' ? 7000 : 1500))
    if (name === 'map') {
      await page.screenshot({ path: join(out, `${name}-${vpName}.png`) })
    } else {
      // Resize instead of fullPage: fullPage capture repeats sticky content on mobile emulation.
      const h = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), 8000)
      await page.setViewport({ ...vp, height: h, deviceScaleFactor: 1 })
      await new Promise((r) => setTimeout(r, 300))
      await page.screenshot({ path: join(out, `${name}-${vpName}.png`) })
      await page.setViewport(vp)
    }
    const title = await page.title()
    console.log(`${vpName.padEnd(5)} ${name.padEnd(16)} ${res.status()} ${title}`)
  }
  await page.close()
}
await browser.close()

if (problems.length) {
  console.log('\nproblems:')
  for (const p of problems) console.log(' -', p)
} else {
  console.log('\nno console errors, page errors or failed requests')
}
