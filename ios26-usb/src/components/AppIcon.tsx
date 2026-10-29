import { useRef } from 'react'
import { APPS } from '../lib/apps'
import type { AppId } from '../types'

interface AppIconProps {
  id: AppId
  onOpen: (id: AppId, origin: DOMRect | null) => void
  showLabel?: boolean
}

export function AppTile({ id, small = false }: { id: AppId; small?: boolean }) {
  const app = APPS[id]
  const Icon = app.icon
  const today = new Date()
  return (
    <span className={`app-tile ${small ? 'app-tile--small' : ''}`} style={{ background: app.background, color: app.foreground }}>
      {id === 'calendar' ? (
        <span className="app-tile__calendar" aria-hidden>
          <span>{today.toLocaleDateString([], { weekday: 'short' })}</span>
          <strong>{today.getDate()}</strong>
        </span>
      ) : (
        <Icon aria-hidden strokeWidth={1.8} />
      )}
    </span>
  )
}

export function AppIcon({ id, onOpen, showLabel = true }: AppIconProps) {
  const tileRef = useRef<HTMLSpanElement>(null)
  return (
    <button type="button" className="app-icon" aria-label={`Open ${APPS[id].name}`} onClick={() => onOpen(id, tileRef.current?.getBoundingClientRect() ?? null)}>
      <span ref={tileRef} className="app-icon__tile-wrap">
        <AppTile id={id} />
      </span>
      {showLabel && <span className="app-icon__label">{APPS[id].name}</span>}
    </button>
  )
}
