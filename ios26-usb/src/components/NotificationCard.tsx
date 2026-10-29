import { useRef, useState, type PointerEvent } from 'react'
import { Usb } from 'lucide-react'
import { APPS } from '../lib/apps'
import { formatRelative } from '../hooks/useNow'
import type { AppId, AppNotification, NotificationActionKind } from '../types'

interface NotificationCardProps {
  notification: AppNotification
  now: number
  onAction: (notification: AppNotification, kind: NotificationActionKind) => void
}

const DISMISS_DISTANCE = 110

export function NotificationCard({ notification, now, onAction }: NotificationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [offset, setOffset] = useState(0)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)

  const app = notification.appId === 'system' ? null : APPS[notification.appId as AppId]
  const Icon = app?.icon ?? Usb

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const dx = event.clientX - drag.current.x
    if (Math.abs(dx) > 6) drag.current.moved = true
    if (drag.current.moved) setOffset(Math.min(0, dx))
  }
  const onPointerUp = () => {
    const state = drag.current
    drag.current = null
    if (!state) return
    if (!state.moved) {
      setExpanded((e) => !e)
    } else if (offset < -DISMISS_DISTANCE) {
      onAction(notification, 'dismiss')
      return
    }
    setOffset(0)
  }

  return (
    <article className={`notification glass ${notification.read ? 'notification--read' : ''}`} aria-label={`${app?.name ?? 'System'}: ${notification.title}`}>
      <div
        className="notification__body"
        style={{ transform: `translateX(${offset}px)`, opacity: 1 + offset / 300 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null
          setOffset(0)
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setExpanded((e) => !e)
          }
          if (event.key === 'Delete' || event.key === 'Backspace') onAction(notification, 'dismiss')
        }}
      >
        <span className="notification__icon" style={{ background: app?.background ?? 'linear-gradient(160deg,#5e5ce6,#30b0c7)', color: app?.foreground ?? '#fff' }}>
          <Icon aria-hidden strokeWidth={2} />
        </span>
        <div className="notification__text">
          <div className="notification__meta">
            <strong>{notification.title}</strong>
            <time dateTime={new Date(notification.time).toISOString()}>{formatRelative(notification.time, now)}</time>
          </div>
          <p className={expanded ? '' : 'notification__clamp'}>{notification.body}</p>
        </div>
      </div>
      {expanded && (
        <div className="notification__actions">
          {(notification.actions ?? [{ label: 'Dismiss', kind: 'dismiss' as const }]).map((action) => (
            <button key={action.label} type="button" className="notification__action" onClick={() => onAction(notification, action.kind)}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}
