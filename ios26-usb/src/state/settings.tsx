import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { WallpaperId } from '../types'

export interface Settings {
  wallpaper: WallpaperId
  appearance: 'dark' | 'light'
  glassStyle: 'clear' | 'tinted'
  refraction: boolean
  reduceMotion: boolean
  reduceTransparency: boolean
  textScale: number
  use24h: boolean
  brightness: number
  volume: number
  haptics: boolean
  syncAndroid: boolean
  airplane: boolean
  wifi: boolean
  bluetooth: boolean
  cellular: boolean
  focus: boolean
  torch: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  wallpaper: 'aurora',
  appearance: 'dark',
  glassStyle: 'clear',
  refraction: false,
  reduceMotion: false,
  reduceTransparency: false,
  textScale: 1,
  use24h: false,
  brightness: 100,
  volume: 60,
  haptics: true,
  syncAndroid: true,
  airplane: false,
  wifi: true,
  bluetooth: true,
  cellular: true,
  focus: false,
  torch: false,
}

// UI preferences live on the device itself; user content (notes) is stored by the local server.
const STORAGE_KEY = 'glass26-settings-v1'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const stored = raw ? (JSON.parse(raw) as Partial<Settings>) : {}
    // The torch is a physical device state, so never restore it as "on".
    return { ...DEFAULT_SETTINGS, ...stored, torch: false }
  } catch {
    return DEFAULT_SETTINGS
  }
}

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Storage can be unavailable (private mode); settings stay in memory.
    }
  }, [settings])

  const update = useCallback((patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch })), [])
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])
  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}
