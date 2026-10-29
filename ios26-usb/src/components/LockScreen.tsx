import { ChevronUp, Flashlight, FlashlightOff, Moon } from 'lucide-react'
import { formatClock, formatLongDate, useNow } from '../hooks/useNow'
import { useSwipe } from '../hooks/useSwipe'
import { useSettings } from '../state/settings'
import { useSystemActions } from '../state/system'
import { useNotifications } from '../state/notifications'
import { NotificationCard } from './NotificationCard'
import type { AppNotification, NotificationActionKind } from '../types'

interface LockScreenProps {
  locked: boolean
  onUnlock: () => void
  onNotificationAction: (notification: AppNotification, kind: NotificationActionKind) => void
}

export function LockScreen({ locked, onUnlock, onNotificationAction }: LockScreenProps) {
  const { settings, update } = useSettings()
  const { setTorch, vibrate } = useSystemActions()
  const { notifications } = useNotifications()
  const now = useNow()
  const swipe = useSwipe('up', onUnlock, 50)
  const unread = notifications.filter((n) => !n.read)

  return (
    <section className={`lock ${locked ? '' : 'lock--hidden'}`} aria-hidden={!locked} aria-label="Lock screen" inert={!locked}>
      <div className="lock__clock">
        <p className="lock__date">{formatLongDate(now)}</p>
        <p className="lock__time">{formatClock(now, settings.use24h)}</p>
      </div>

      <div className="lock__notifications">
        {unread.slice(0, 4).map((n) => (
          <NotificationCard key={n.id} notification={n} now={now.getTime()} onAction={onNotificationAction} />
        ))}
        {unread.length > 4 && <p className="lock__more">{`+${unread.length - 4} more notifications`}</p>}
      </div>

      <div className="lock__footer">
        <button
          type="button"
          className={`lock__quick glass ${settings.torch ? 'is-active' : ''}`}
          aria-pressed={settings.torch}
          aria-label="Flashlight"
          onClick={() => {
            vibrate()
            setTorch(!settings.torch)
          }}
        >
          {settings.torch ? <Flashlight aria-hidden /> : <FlashlightOff aria-hidden />}
        </button>
        <div className="lock__unlock" {...swipe}>
          <button type="button" className="lock__unlock-button" onClick={onUnlock}>
            <ChevronUp aria-hidden />
            <span>Swipe up to open</span>
          </button>
        </div>
        <button
          type="button"
          className={`lock__quick glass ${settings.focus ? 'is-active' : ''}`}
          aria-pressed={settings.focus}
          aria-label="Focus"
          onClick={() => update({ focus: !settings.focus })}
        >
          <Moon aria-hidden />
        </button>
      </div>
    </section>
  )
}
