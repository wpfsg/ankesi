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

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function shot(name) {
  await page.screenshot({ path: join(out, `${name}.png`) })
  console.log('shot', name)
}

async function layoutFacts() {
  return page.evaluate(() => {
    const canvas = document.querySelector('.maplibregl-canvas')
    const header = document.querySelector('.header')
    const row = document.querySelector('.header-row')
    const bubbles = [...document.querySelectorAll('.bubble')]
    const visibleBubbles = bubbles.filter((b) => {
      if (b.closest('.marker')?.style.display === 'none') return false
      const r = b.getBoundingClientRect()
      const s = getComputedStyle(b)
      return r.width > 0 && parseFloat(s.opacity) > 0.5 && s.visibility !== 'hidden' && r.left > -50 && r.left < innerWidth + 50 && r.top > -50 && r.top < innerHeight + 50
    })
    const attrib = document.querySelector('.maplibregl-ctrl-attrib a')
    return {
      visibleBubbles: visibleBubbles.length,
      viewport: [innerWidth, innerHeight],
      canvas: canvas ? [canvas.clientWidth, canvas.clientHeight] : null,
      headerH: header?.offsetHeight,
      headerVar: getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim(),
      rowOverflow: row ? row.scrollWidth > row.clientWidth : null,
      bubbles: bubbles.length,
      lang: document.documentElement.lang,
      theme: document.documentElement.dataset.theme,
      attribColor: attrib && getComputedStyle(attrib).color,
      title: document.title,
    }
  })
}

// --- phone, Georgian, light ---
await page.setViewport({ width: 430, height: 900, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
await page.goto(`${base}/ka`, { waitUntil: 'domcontentloaded', timeout: 60000 })

// splash: capture frames of the animation, then confirm it goes away
await page.waitForSelector('.splash', { timeout: 10000 })
console.log('splash present at first paint: true')
for (const [ms, name] of [[300, '00a-splash-unfold'], [900, '00b-splash-cast'], [500, '00c-splash-land'], [900, '00d-splash-bite']]) {
  await wait(ms)
  await shot(name)
}
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 20000 })
console.log('splash gone: true')

await page.waitForSelector('.bubble[data-band]:not([data-band="none"])', { timeout: 30000 })
await wait(2500)
console.log('facts/phone-ka', JSON.stringify(await layoutFacts()))
await shot('01-phone-ka-map')

// theme toggle
await page.evaluate(() => document.querySelector('.icon-toggle').click())
await wait(400)
console.log('after theme toggle', JSON.stringify(await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor, saved: localStorage.getItem('ankesi.theme') }))))
await shot('01b-phone-ka-dark')
await page.evaluate(() => document.querySelector('.icon-toggle').click())
await wait(400)

// select the highest-scoring spot bubble (not a cluster); the sheet opens full
const bestId = await page.evaluate(() => {
  const list = [...document.querySelectorAll('.bubble:not(.cluster)')].map((b) => ({ s: Number(b.textContent), b }))
  list.sort((a, b) => b.s - a.s)
  list[0].b.click()
  return list[0].b.getAttribute('aria-label')
})
console.log('selected', bestId)
await wait(1500)
console.log('sheet', JSON.stringify(await page.evaluate(() => {
  const s = document.querySelector('.sheet')
  const r = s.getBoundingClientRect()
  const h = document.querySelector('.header').getBoundingClientRect()
  return { top: Math.round(r.top), headerBottom: Math.round(h.bottom), belowHeader: r.top >= h.bottom, scroll: document.querySelector('.sheet-body').dataset.scroll }
})))
await shot('02-phone-ka-sheet-full')
const sheetText = await page.evaluate(() => document.querySelector('.sheet-body')?.innerText.slice(0, 700))
console.log('--- sheet text ---\n' + sheetText + '\n---')

// actions row → without a backend the account modal must explain that
await page.evaluate(() => document.querySelector('.actions .btn').click())
await wait(600)
console.log('modal text', JSON.stringify(await page.evaluate(() => document.querySelector('.modal')?.innerText.slice(0, 160))))
await page.evaluate(() => document.querySelector('.modal .iconbtn').click())
await wait(900)
console.log('modal closed', await page.evaluate(() => !document.querySelector('.modal')))

// header account button opens the account modal too
await page.evaluate(() => document.querySelector('.account-btn').click())
await wait(600)
console.log('account modal open', await page.evaluate(() => !!document.querySelector('.modal')))
await page.evaluate(() => document.querySelector('.modal .iconbtn').click())
await wait(900)

// switch to English
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.langchip button')].find((b) => b.textContent.trim() === 'EN')
  btn.click()
})
await wait(800)
console.log('lang after toggle', await page.evaluate(() => document.documentElement.lang + ' ' + location.pathname))
await shot('03-phone-en-sheet-full')

// search from the header
await page.evaluate(() => document.querySelector('.sheet .iconbtn').click())
await wait(800)
await page.type('.search input', 'lisi')
await wait(400)
console.log('search results', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.header-results .result-name')].map((n) => n.firstChild.textContent.trim()))))
await shot('04-phone-en-search')
await page.evaluate(() => document.querySelector('.header-results .result').click())
await wait(1200)

// trip planner
await page.evaluate(() => document.querySelector('.sheet .iconbtn').click())
await wait(800)
await page.evaluate(() => document.querySelector('.pill-button').click())
await wait(800)
await shot('05-phone-en-trip')

// --- desktop, English, dark ---
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
await page.evaluate(() => localStorage.removeItem('ankesi.theme'))
await page.goto(`${base}/en`, { waitUntil: 'networkidle2', timeout: 60000 })
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 20000 })
await page.waitForSelector('.bubble[data-band]:not([data-band="none"])', { timeout: 30000 })
await wait(3000)
console.log('facts/desktop-en-dark', JSON.stringify(await layoutFacts()))
await page.evaluate(() => {
  const list = [...document.querySelectorAll('.bubble:not(.cluster)')].map((b) => ({ s: Number(b.textContent), b }))
  list.sort((a, b) => b.s - a.s)
  list[0].b.click()
})
await wait(2500)
await shot('06-desktop-en-dark')

console.log('--- problems ---')
const uniq = [...new Set(problems)].filter((p) => !p.includes('.pbf net::ERR_ABORTED'))
for (const p of uniq) console.log(p)
if (uniq.length === 0) console.log('none')
await browser.close()
