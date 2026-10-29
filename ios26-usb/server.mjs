import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkUsb, handleApiRequest, loadConfig } from './lib/usb-check.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT ?? 8026)
const HOST = process.env.HOST ?? '127.0.0.1'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'geolocation=(self), camera=(self), usb=(self), microphone=()',
}

if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/ not found. Run "npm run build" first (or use "npm run launch").')
  process.exit(1)
}

const server = createServer(async (req, res) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(key, value)

  if (await handleApiRequest(req, res)) return

  const url = new URL(req.url ?? '/', 'http://localhost')
  const requested = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '')
  let filePath = path.join(DIST, requested)
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html')
  }

  const ext = path.extname(filePath)
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', filePath.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache')
  createReadStream(filePath).pipe(res)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or run: PORT=8027 npm start`)
  } else {
    console.error(`Server error: ${error.message}`)
  }
  process.exit(1)
})

server.listen(PORT, HOST, async () => {
  console.log(`\n  iOS 26 USB Edition running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n`)
  try {
    const config = await loadConfig()
    const result = await checkUsb(config)
    console.log(`  USB check (${result.method}): ${result.ok ? 'verified' : 'not verified'}${result.reason ? ` - ${result.reason}` : ''}\n`)
  } catch (error) {
    console.error(`  USB config error: ${error.message}\n`)
  }
})
