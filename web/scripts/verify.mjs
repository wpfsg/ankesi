// Drives the local Chrome against the dev server, captures screenshots and
// reports console errors, failed requests, and layout facts.
// Usage: node scripts/verify.mjs [baseUrl] [outDir]
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const base = process.argv[2] ?? 'http://localhost:5173'
const out = process.argv[3] ?? 'shots'
mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars'],
})

const problems = []
const page = await browser.newPage()
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') problems.push(`console.${m.type()}: ${m.text()}`)
})
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`))
page.on('response', (r) => {
  if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`)
})

async function shot(name) {
  await page.screenshot({ path: join(out, `${name}.png`) })
  console.log('shot', name)
}

async function layoutFacts() {
  return page.evaluate(() => {
    const canvas = document.querySelector('.maplibregl-canvas')
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')
    const marker = document.querySelector('.marker')
    const pill = document.querySelector('.pill')
    const top = document.querySelector('.top')
    const bubbles = [...document.querySelectorAll('.bubble')]
    const visible = bubbles.filter((b) => {
      const r = b.getBoundingClientRect()
      return r.width > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight
    })
    return {
      viewport: [innerWidth, innerHeight],
      webgl: !!gl,
      canvas: canvas ? [canvas.width, canvas.height, canvas.clientWidth, canvas.clientHeight] : null,
      markerTransform: marker?.style.transform ?? null,
      markerRect: marker ? [marker.getBoundingClientRect().left, marker.getBoundingClientRect().top] : null,
      bubbles: bubbles.length,
      bubblesVisible: visible.length,
      pillRight: pill?.getBoundingClientRect().right,
      topRight: top?.getBoundingClientRect().right,
      lang: document.documentElement.lang,
      title: document.title,
    }
  })
}

// --- phone, Georgian, light ---
await page.setViewport({ width: 430, height: 900, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
await page.goto(`${base}/ka`, { waitUntil: 'networkidle2', timeout: 60000 })
await page.waitForSelector('.bubble[data-band]:not([data-band="none"])', { timeout: 30000 })
await new Promise((r) => setTimeout(r, 4000))
console.log('facts/phone-ka', JSON.stringify(await layoutFacts()))
await shot('01-phone-ka-map')

// tap the highest-scoring spot bubble (not a cluster)
const bestId = await page.evaluate(() => {
  const list = [...document.querySelectorAll('.bubble:not(.cluster)')].map((b) => ({ s: Number(b.textContent), b }))
  list.sort((a, b) => b.s - a.s)
  list[0].b.click()
  return list[0].b.getAttribute('aria-label')
})
console.log('selected', bestId)
await new Promise((r) => setTimeout(r, 1500))
await shot('02-phone-ka-sheet-peek')

// expand the sheet fully
await page.evaluate(() => {
  const h = document.querySelector('.sheet-handle')
  h.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
})
await new Promise((r) => setTimeout(r, 1200))
await shot('03-phone-ka-sheet-full')
const sheetText = await page.evaluate(() => document.querySelector('.sheet-body')?.innerText.slice(0, 1600))
console.log('--- sheet text ---\n' + sheetText + '\n---')

// actions row → without a backend the account modal must explain that
await page.evaluate(() => document.querySelector('.actions .btn').click())
await new Promise((r) => setTimeout(r, 600))
console.log('modal text', JSON.stringify(await page.evaluate(() => document.querySelector('.modal')?.innerText.slice(0, 160))))
await shot('03b-phone-ka-modal-nobackend')
await page.evaluate(() => document.querySelector('.modal .iconbtn').click())
await new Promise((r) => setTimeout(r, 900)) // exit animation
console.log('modal closed', await page.evaluate(() => !document.querySelector('.modal')))
console.log('account pill', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.top-row .pill-button')].map((b) => b.innerText.trim()))))

// switch to English
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.langchip button')].find((b) => b.textContent.trim() === 'EN')
  btn.click()
})
await new Promise((r) => setTimeout(r, 800))
console.log('lang after toggle', await page.evaluate(() => document.documentElement.lang + ' ' + location.pathname))
await shot('04-phone-en-sheet-full')

// close sheet, open trip planner
await page.evaluate(() => document.querySelector('.sheet .iconbtn').click())
await new Promise((r) => setTimeout(r, 800))
await page.evaluate(() => document.querySelector('.pill-button').click())
await new Promise((r) => setTimeout(r, 800))
await shot('05-phone-en-trip')
const tripText = await page.evaluate(() => document.querySelector('.panel-list')?.innerText.slice(0, 500))
console.log('--- trip ---\n' + tripText + '\n---')

// --- desktop, English, dark ---
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
await page.goto(`${base}/en`, { waitUntil: 'networkidle2', timeout: 60000 })
await page.waitForSelector('.bubble[data-band]:not([data-band="none"])', { timeout: 30000 })
await new Promise((r) => setTimeout(r, 4000))
console.log('facts/desktop-en-dark', JSON.stringify(await layoutFacts()))
await page.evaluate(() => {
  const list = [...document.querySelectorAll('.bubble:not(.cluster)')].map((b) => ({ s: Number(b.textContent), b }))
  list.sort((a, b) => b.s - a.s)
  list[0].b.click()
})
await new Promise((r) => setTimeout(r, 2500))
await shot('06-desktop-en-dark')
console.log('clusters', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.bubble.cluster')].map((b) => b.textContent))))

console.log('--- problems ---')
for (const p of [...new Set(problems)]) console.log(p)
if (problems.length === 0) console.log('none')
await browser.close()
