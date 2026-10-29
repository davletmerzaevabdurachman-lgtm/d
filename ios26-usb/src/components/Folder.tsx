import { useEffect, useRef } from 'react'
import { AppIcon, AppTile } from './AppIcon'
import type { AppId } from '../types'

interface FolderTileProps {
  name: string
  apps: AppId[]
  onOpenFolder: () => void
}

export function FolderTile({ name, apps, onOpenFolder }: FolderTileProps) {
  return (
    <button type="button" className="app-icon" aria-label={`Open folder ${name}`} aria-haspopup="dialog" onClick={onOpenFolder}>
      <span className="folder-tile glass">
        {apps.slice(0, 4).map((id) => (
          <AppTile key={id} id={id} small />
        ))}
      </span>
      <span className="app-icon__label">{name}</span>
    </button>
  )
}

interface FolderViewProps {
  name: string
  apps: AppId[]
  open: boolean
  onClose: () => void
  onOpenApp: (id: AppId, origin: DOMRect | null) => void
}

export function FolderView({ name, apps, open, onClose, onOpenApp }: FolderViewProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  return (
    <div className={`folder-overlay ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden={!open} inert={!open}>
      <h2 className="folder-overlay__title">{name}</h2>
      <div
        ref={panelRef}
        className="folder-overlay__panel glass glass-refract"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} folder`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {apps.map((id) => (
          <AppIcon
            key={id}
            id={id}
            onOpen={(appId, origin) => {
              onClose()
              onOpenApp(appId, origin)
            }}
          />
        ))}
      </div>
    </div>
  )
}
