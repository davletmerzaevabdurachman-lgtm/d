export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      message = (await response.json()).error ?? message
    } catch {
      // Non-JSON error bodies keep the generic message.
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

async function trustedRequest(url: string, method: 'POST' | 'PUT', body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Glass26': '1' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error ?? `Request failed (${response.status})`)
  }
  return data
}

export type SystemAction = 'brightness' | 'volume' | 'torch' | 'wifi' | 'vibrate'

export function postSystem(action: SystemAction, body: Record<string, unknown> = {}) {
  return trustedRequest(`/api/system/${action}`, 'POST', body)
}

export function putJson(url: string, body: unknown) {
  return trustedRequest(url, 'PUT', body)
}
