import { useCallback, useRef } from 'react'
import useSWR from 'swr'
import { postSystem, type SystemAction } from '../lib/api'
import { useSettings } from './settings'

const ERROR_KEY = 'system:last-error'

/** Last Termux:API error, shared between Control Center and Settings via SWR's cache. */
export function useSystemError() {
  const { data, mutate } = useSWR<string | null>(ERROR_KEY, null, { fallbackData: null })
  return { error: data ?? null, setError: (message: string | null) => mutate(message, { revalidate: false }) }
}

/**
 * Updates the on-screen setting immediately and, when "Sync with Android" is on,
 * forwards the change to Termux:API (debounced for sliders).
 */
export function useSystemActions() {
  const { settings, update } = useSettings()
  const { setError } = useSystemError()
  const timers = useRef<Partial<Record<SystemAction, number>>>({})
  const syncRef = useRef(settings.syncAndroid)
  syncRef.current = settings.syncAndroid
  const setErrorRef = useRef(setError)
  setErrorRef.current = setError

  const send = useCallback((action: SystemAction, body: Record<string, unknown>, debounceMs = 0) => {
    if (!syncRef.current) return
    window.clearTimeout(timers.current[action])
    timers.current[action] = window.setTimeout(() => {
      postSystem(action, body)
        .then(() => setErrorRef.current(null))
        .catch((error: Error) => setErrorRef.current(`${action}: ${error.message}`))
    }, debounceMs)
  }, [])

  const setBrightness = useCallback(
    (value: number) => {
      update({ brightness: value })
      send('brightness', { value: Math.round(value * 2.55) }, 250)
    },
    [update, send],
  )
  const setVolume = useCallback(
    (value: number) => {
      update({ volume: value })
      send('volume', { value }, 250)
    },
    [update, send],
  )
  const setTorch = useCallback(
    (on: boolean) => {
      update({ torch: on })
      send('torch', { on })
    },
    [update, send],
  )
  const setWifi = useCallback(
    (on: boolean) => {
      update({ wifi: on })
      send('wifi', { on })
    },
    [update, send],
  )
  const vibrate = useCallback(() => {
    navigator.vibrate?.(40)
    send('vibrate', {})
  }, [send])

  return { setBrightness, setVolume, setTorch, setWifi, vibrate }
}
