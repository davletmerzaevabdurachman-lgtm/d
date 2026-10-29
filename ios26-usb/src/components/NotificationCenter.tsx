import { X } from 'lucide-react'
import { formatClock, formatLongDate, useNow } from '../hooks/useNow'
import { useSwipe } from '../hooks/useSwipe'
import { useNotifications } from '../state/notifications'
import { useSettings } from '../state/settings'
import { NotificationCard } from './NotificationCard'
import type { AppNotification, NotificationActionKind } from '../types'

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
  onAction: (notification: AppNotification, kind: NotificationActionKind) => void
}

export function NotificationCenter({ open, onClose, onAction }: NotificationCenterProps) {
  const { notifications, clearAll } = useNotifications()
  const { settings } = useSettings()
  const now = useNow()
  const swipe = useSwipe('up', onClose, 60)

  return (
    <div className={`overlay nc ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="nc__panel" role="dialog" aria-modal="true" aria-label="Notification Center">
        <div className="nc__clock" {...swipe}>
          <p className="lock__date">{formatLongDate(now)}</p>
          <p className="lock__time">{formatClock(now, settings.use24h)}</p>
        </div>
        <div className="nc__header">
          <h2>Notification Centre</h2>
          {notifications.length > 0 && (
            <button type="button" className="nc__clear glass" onClick={clearAll} aria-label="Clear all notifications">
              <X aria-hidden />
            </button>
          )}
        </div>
        <div className="nc__list">
          {notifications.length === 0 ? (
            <p className="nc__empty">No Older Notifications</p>
          ) : (
            notifications.map((n) => <NotificationCard key={n.id} notification={n} now={now.getTime()} onAction={onAction} />)
          )}
        </div>
        <button type="button" className="nc__close" onClick={onClose} {...swipe}>
          <span className="home-indicator__bar" aria-hidden />
          <span className="sr-only">Close Notification Center</span>
        </button>
      </div>
    </div>
  )
}
