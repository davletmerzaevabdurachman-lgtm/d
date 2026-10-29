import { execFile } from 'node:child_process'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data')
const NOTES_PATH = path.join(DATA_DIR, 'notes.json')
const TIMEOUT_MS = 15000
const MAX_BODY_BYTES = 512 * 1024

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: TIMEOUT_MS, maxBuffer: 256 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 'ENOENT') {
          reject(Object.assign(new Error(`${command} not found. Install Termux:API: "pkg install termux-api" + the Termux:API app.`), { status: 501 }))
        } else if (error.killed) {
          reject(Object.assign(new Error(`${command} timed out. Open the Termux:API app once and disable battery optimisation for it.`), { status: 504 }))
        } else {
          reject(Object.assign(new Error((stderr || stdout || error.message).toString().trim()), { status: 502 }))
        }
        return
      }
      resolve(String(stdout).trim())
    })
  })
}

function clampInt(value, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) throw Object.assign(new Error('"value" must be a number'), { status: 400 })
  return Math.round(Math.min(max, Math.max(min, n)))
}

let cachedMusicMax = null
async function musicMaxVolume() {
  if (cachedMusicMax) return cachedMusicMax
  const streams = JSON.parse((await run('termux-volume', [])) || '[]')
  const music = streams.find((s) => s.stream === 'music')
  cachedMusicMax = music?.max_volume ?? 15
  return cachedMusicMax
}

const ACTIONS = {
  async brightness(body) {
    await run('termux-brightness', [String(clampInt(body.value, 0, 255))])
  },
  async volume(body) {
    const percent = clampInt(body.value, 0, 100)
    const max = await musicMaxVolume()
    await run('termux-volume', ['music', String(Math.round((percent / 100) * max))])
  },
  async torch(body) {
    await run('termux-torch', [body.on ? 'on' : 'off'])
  },
  async wifi(body) {
    await run('termux-wifi-enable', [body.on ? 'true' : 'false'])
  },
  async vibrate() {
    await run('termux-vibrate', ['-d', '40'])
  },
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Write requests must carry a custom header and a JSON content type. Browsers
 * cannot send those cross-origin without a CORS preflight, which this server
 * never approves, so other websites cannot drive these endpoints.
 */
function assertTrustedWrite(req) {
  const contentType = String(req.headers['content-type'] ?? '')
  if (req.headers['x-glass26'] !== '1' || !contentType.startsWith('application/json')) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
}

function validateNotes(input) {
  if (!Array.isArray(input) || input.length > 500) {
    throw Object.assign(new Error('Notes must be an array of at most 500 items'), { status: 400 })
  }
  return input.map((note) => {
    if (typeof note?.id !== 'string' || note.id.length > 64 || typeof note.text !== 'string' || note.text.length > 20000) {
      throw Object.assign(new Error('Invalid note'), { status: 400 })
    }
    return { id: note.id, text: note.text, updatedAt: clampInt(note.updatedAt, 0, Number.MAX_SAFE_INTEGER) }
  })
}

async function readNotes() {
  try {
    return JSON.parse(await readFile(NOTES_PATH, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writeNotes(notes) {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${NOTES_PATH}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(notes, null, 2))
  await rename(tmp, NOTES_PATH)
}

export async function handleSystemRequest(req, url, send) {
  try {
    if (url.pathname === '/api/notes') {
      if (req.method === 'GET') return send(200, await readNotes())
      if (req.method === 'PUT') {
        assertTrustedWrite(req)
        const notes = validateNotes(await readJsonBody(req))
        await writeNotes(notes)
        return send(200, notes)
      }
      return send(405, { error: 'Method not allowed' })
    }

    if (url.pathname === '/api/system/battery' && req.method === 'GET') {
      const status = JSON.parse(await run('termux-battery-status', []))
      return send(200, { ok: true, level: status.percentage, charging: status.status === 'CHARGING' || status.plugged !== 'UNPLUGGED' })
    }

    const action = url.pathname.replace('/api/system/', '')
    if (req.method === 'POST' && Object.hasOwn(ACTIONS, action)) {
      assertTrustedWrite(req)
      await ACTIONS[action](await readJsonBody(req))
      return send(200, { ok: true })
    }

    return send(404, { error: 'Not found' })
  } catch (error) {
    return send(error.status ?? 500, { ok: false, error: error.message })
  }
}
