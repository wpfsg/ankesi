import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader'] })
const page = await browser.newPage()
const log = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push('page ' + m.type() + ': ' + m.text().slice(0, 200)) })
page.on('pageerror', (e) => log.push('pageerror: ' + e.message.slice(0, 200)))
page.on('workercreated', (w) => { log.push('worker created: ' + w.url().slice(0, 120)); w.on('console', (m) => log.push('worker console: ' + m.text().slice(0, 200))) })
page.on('workerdestroyed', (w) => log.push('worker destroyed: ' + w.url().slice(0, 120)))
const cdp = await page.createCDPSession()
await cdp.send('Network.enable')
const urls = { tiles: 0, tileFail: 0, style: 0, other404: [] }
cdp.on('Network.responseReceived', (e) => { const u = e.response.url; if (u.includes('.pbf')) urls.tiles++; if (u.includes('styles/')) urls.style++; if (e.response.status >= 400) urls.other404.push(e.response.status + ' ' + u.slice(0, 120)) })
cdp.on('Network.loadingFailed', (e) => { urls.tileFail++ })
await page.setViewport({ width: 430, height: 900, deviceScaleFactor: 2 })
await page.evaluateOnNewDocument(() => localStorage.setItem('ankesi.theme', 'light'))
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 30000 }).catch(() => log.push('splash never left'))
await new Promise(r => setTimeout(r, 10000))
const px = await page.evaluate(() => {
  const c = document.querySelector('.maplibregl-canvas')
  const gl = c.getContext('webgl2') || c.getContext('webgl')
  if (!gl) return 'no gl'
  const buf = new Uint8Array(4 * 100)
  const pts = []
  for (let i = 0; i < 100; i++) { const x = Math.floor(Math.random() * gl.drawingBufferWidth), y = Math.floor(Math.random() * gl.drawingBufferHeight); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf.subarray(i*4, i*4+4)); pts.push(buf[i*4+3]) }
  return { nonTransparent: pts.filter(a => a > 0).length, of: 100 }
})
console.log('url', process.argv[2])
console.log('network', JSON.stringify(urls))
console.log('canvas pixels', JSON.stringify(px))
console.log('log:'); for (const l of log) console.log(' ', l)
await page.screenshot({ path: process.argv[3] })
await browser.close()
