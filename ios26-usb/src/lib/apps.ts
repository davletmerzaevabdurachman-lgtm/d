import { Calculator, CalendarDays, Clock, Images, NotebookPen, Settings, type LucideIcon } from 'lucide-react'
import type { AppId, WallpaperId } from '../types'

export interface AppMeta {
  name: string
  icon: LucideIcon
  background: string
  foreground: string
}

export const APPS: Record<AppId, AppMeta> = {
  settings: { name: 'Settings', icon: Settings, background: 'linear-gradient(160deg,#c7c7cc,#636366)', foreground: '#fff' },
  notes: { name: 'Notes', icon: NotebookPen, background: 'linear-gradient(160deg,#ffe27a,#ffb300)', foreground: '#fff' },
  calculator: { name: 'Calculator', icon: Calculator, background: 'linear-gradient(160deg,#48484a,#0c0c0d)', foreground: '#ff9f0a' },
  clock: { name: 'Clock', icon: Clock, background: 'linear-gradient(160deg,#2c2c2e,#000)', foreground: '#fff' },
  photos: { name: 'Photos', icon: Images, background: 'linear-gradient(150deg,#ff7ac6,#7a5cff 55%,#2fd1ff)', foreground: '#fff' },
  calendar: { name: 'Calendar', icon: CalendarDays, background: 'linear-gradient(160deg,#ffffff,#e5e5ea)', foreground: '#ff3b30' },
}

export const HOME_APPS: AppId[] = ['calendar', 'clock', 'photos']
export const FOLDER = { name: 'Utilities', apps: ['calculator', 'clock', 'settings'] as AppId[] }
export const DOCK_APPS: AppId[] = ['notes', 'calculator', 'photos', 'settings']

export const WALLPAPERS: { id: WallpaperId; name: string; src: string }[] = [
  { id: 'aurora', name: 'Aurora Glass', src: '/wallpapers/aurora.png' },
  { id: 'ocean', name: 'Ocean Glass', src: '/wallpapers/ocean.png' },
  { id: 'dune', name: 'Dune Glass', src: '/wallpapers/dune.png' },
  { id: 'graphite', name: 'Graphite', src: '/wallpapers/graphite.png' },
]

export function wallpaperSrc(id: WallpaperId) {
  return (WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]).src
}
