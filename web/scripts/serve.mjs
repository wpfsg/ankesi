// Serves dist/ the way GitHub Pages does: `/a/b` → `a/b.html` or
// `a/b/index.html`, unknown paths → 404.html with a 404 status. No SPA
// fallback, so prerendered pages are what you see.
//   node scripts/serve.mjs [port] [dir]
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createGzip } from 'node:zlib'
import { extname, join, normalize, resolve } from 'node:path'

const port = Number(process.argv[2] ?? 4173)
const root = resolve(process.argv[3] ?? 'dist')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
}

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  const candidates = clean.endsWith('/')
    ? [join(root, clean, 'index.html')]
    : [join(root, clean), join(root, `${clean}.html`), join(root, clean, 'index.html')]
  for (const c of candidates) {
    if (c.startsWith(root) && existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.xml', '.txt', '.svg', '.map'])

function send(req, res, file, status = 200) {
  const ext = extname(file)
  const headers = { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' }
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')
  if (gzip) headers['content-encoding'] = 'gzip'
  res.writeHead(status, headers)
  const stream = createReadStream(file)
  if (gzip) stream.pipe(createGzip()).pipe(res)
  else stream.pipe(res)
}

createServer((req, res) => {
  const file = resolveFile(req.url ?? '/')
  if (file) return send(req, res, file)
  const notFound = join(root, '404.html')
  if (existsSync(notFound)) return send(req, res, notFound, 404)
  res.writeHead(404).end('not found')
}).listen(port, () => console.log(`serving ${root} at http://localhost:${port}`))
