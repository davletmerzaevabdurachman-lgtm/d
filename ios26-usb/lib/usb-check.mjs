import { execFile } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleSystemRequest } from './system-api.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG_PATH = path.join(ROOT, 'usb.config.json')
const DESCRIPTOR_HELPER = path.join(ROOT, 'scripts', 'usb-descriptor.sh')

export const DEFAULT_CONFIG = {
  required: true,
  strategy: 'any',
  device: {
    name: 'USB key',
    vendorId: null,
    productId: null,
    serialNumber: null,
  },
  recheckIntervalSeconds: 5,
  lockOnRemoval: true,
  allowDemoMode: false,
  commandTimeoutSeconds: 20,
}

const HEX_ID = /^[0-9a-f]{4}$/

function normalizeHexId(value) {
  if (value === null || value === undefined || value === '') return null
  const raw = String(value).toLowerCase().replace(/^0x/, '')
  const padded = raw.padStart(4, '0')
  if (!HEX_ID.test(padded)) {
    throw new Error(`Invalid USB id "${value}". Use 4 hex digits, e.g. "0781".`)
  }
  return padded
}

export async function loadConfig() {
  let fileConfig = {}
  try {
    fileConfig = JSON.parse(await readFile(CONFIG_PATH, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`usb.config.json could not be parsed: ${error.message}`)
    }
  }
  const config = {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    device: { ...DEFAULT_CONFIG.device, ...(fileConfig.device ?? {}) },
  }
  if (!['termux', 'webusb', 'any'].includes(config.strategy)) {
    throw new Error(`usb.config.json: "strategy" must be "termux", "webusb" or "any" (got "${config.strategy}")`)
  }
  config.device.vendorId = normalizeHexId(config.device.vendorId)
  config.device.productId = normalizeHexId(config.device.productId)
  return config
}

/** Config subset that is safe to expose to the browser. */
export function publicConfig(config) {
  return {
    required: config.required,
    strategy: config.strategy,
    device: config.device,
    recheckIntervalSeconds: config.recheckIntervalSeconds,
    lockOnRemoval: config.lockOnRemoval,
    allowDemoMode: config.allowDemoMode,
  }
}

function run(command, args, timeoutMs, env) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { timeout: timeoutMs, env: { ...process.env, ...env }, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout
          error.stderr = stderr
          reject(error)
          return
        }
        resolve(String(stdout).trim())
      },
    )
  })
}

function matchesIds(config, ids) {
  const { vendorId, productId } = config.device
  if (vendorId && ids.vendorId !== vendorId) return false
  if (productId && ids.productId !== productId) return false
  return true
}

/**
 * Termux path: uses the Termux:API `termux-usb` command, which talks to
 * Android's UsbManager on our behalf. No root is required, but Android shows a
 * permission dialog the first time each device is opened.
 */
async function checkWithTermux(config) {
  const timeoutMs = config.commandTimeoutSeconds * 1000
  let devices
  try {
    const output = await run('termux-usb', ['-l'], timeoutMs)
    devices = JSON.parse(output || '[]')
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { available: false, reason: 'termux-usb not found. Run "pkg install termux-api" and install the Termux:API app.' }
    }
    if (error.killed) {
      return { available: false, reason: 'termux-usb timed out. Open the Termux:API app once and allow it to run in the background.' }
    }
    return { available: false, reason: `termux-usb failed: ${(error.stderr || error.message).trim()}` }
  }

  if (!Array.isArray(devices) || devices.length === 0) {
    return { available: true, connected: false, devices: [], reason: 'No USB device is attached (check your OTG adapter).' }
  }

  const needsIds = Boolean(config.device.vendorId || config.device.productId)
  if (!needsIds) {
    return { available: true, connected: true, devices: devices.map((p) => ({ path: p })), matched: { path: devices[0] } }
  }

  const inspected = []
  for (const devicePath of devices) {
    try {
      const output = await run('termux-usb', ['-r', '-E', '-e', DESCRIPTOR_HELPER, devicePath], timeoutMs)
      const jsonLine = output.split('\n').reverse().find((line) => line.trim().startsWith('{'))
      if (!jsonLine) throw new Error(output || 'No descriptor output')
      const ids = JSON.parse(jsonLine)
      inspected.push({ path: devicePath, ...ids })
      if (matchesIds(config, ids)) {
        return { available: true, connected: true, devices: inspected, matched: { path: devicePath, ...ids } }
      }
    } catch (error) {
      const message = (error.stdout || error.stderr || error.message || '').toString().trim()
      inspected.push({ path: devicePath, error: message })
    }
  }

  const denied = inspected.some((d) => /permission/i.test(d.error ?? ''))
  return {
    available: true,
    connected: false,
    devices: inspected,
    reason: denied
      ? 'Android denied USB access. Re-plug the device and tap "OK" on the permission dialog.'
      : `A USB device is attached, but none matches ${config.device.vendorId ?? '*'}:${config.device.productId ?? '*'}.`,
  }
}

/**
 * Desktop Linux / rooted path: reads /sys/bus/usb. On stock Android this is
 * blocked by SELinux, so it is only a fallback for testing on a computer.
 */
async function checkWithSysfs(config) {
  const base = '/sys/bus/usb/devices'
  if (!existsSync(base)) return { available: false, reason: 'sysfs USB tree not readable.' }
  let entries
  try {
    entries = await readdir(base)
  } catch {
    return { available: false, reason: 'sysfs USB tree not readable (expected on non-rooted Android).' }
  }
  const devices = []
  for (const entry of entries) {
    if (entry.includes(':') || entry.startsWith('usb')) continue
    try {
      const vendorId = (await readFile(path.join(base, entry, 'idVendor'), 'utf8')).trim()
      const productId = (await readFile(path.join(base, entry, 'idProduct'), 'utf8')).trim()
      devices.push({ path: entry, vendorId, productId })
    } catch {
      // Interfaces and hubs without descriptors are skipped.
    }
  }
  const matched = devices.find((d) => matchesIds(config, d))
  return matched
    ? { available: true, connected: true, devices, matched }
    : { available: true, connected: false, devices, reason: 'No matching USB device found via sysfs.' }
}

export async function checkUsb(config) {
  const checkedAt = new Date().toISOString()
  if (!config.required) {
    return { ok: true, method: 'disabled', checkedAt, reason: 'USB requirement disabled in usb.config.json.' }
  }
  if (config.strategy === 'webusb') {
    return { ok: false, method: 'none', checkedAt, deferToBrowser: true, reason: 'Strategy is "webusb": verification happens in the browser.' }
  }

  const termux = await checkWithTermux(config)
  if (termux.available) {
    return { ok: Boolean(termux.connected), method: 'termux-usb', checkedAt, ...termux, deferToBrowser: config.strategy === 'any' && !termux.connected }
  }

  const sysfs = await checkWithSysfs(config)
  if (sysfs.available) {
    return { ok: Boolean(sysfs.connected), method: 'sysfs', checkedAt, ...sysfs, deferToBrowser: config.strategy === 'any' && !sysfs.connected }
  }

  return {
    ok: false,
    method: 'none',
    checkedAt,
    available: false,
    deferToBrowser: config.strategy === 'any',
    reason: termux.reason,
  }
}

/** Shared request handler for the production server and the Vite dev server. */
export async function handleApiRequest(req, res) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return false

  const send = (status, body) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(body))
  }

  if (url.pathname === '/api/notes' || url.pathname.startsWith('/api/system/')) {
    await handleSystemRequest(req, url, send)
    return true
  }

  try {
    const config = await loadConfig()
    if (url.pathname === '/api/config') {
      send(200, publicConfig(config))
    } else if (url.pathname === '/api/usb') {
      send(200, await checkUsb(config))
    } else {
      send(404, { error: 'Not found' })
    }
  } catch (error) {
    send(500, { ok: false, error: error.message })
  }
  return true
}
