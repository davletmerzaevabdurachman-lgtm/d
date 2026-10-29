import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Bluetooth, Moon, Plane, SignalHigh, Usb, Wifi } from 'lucide-react'
import { formatClock, useNow } from '../hooks/useNow'
import { useSwipe } from '../hooks/useSwipe'
import { useBattery } from '../hooks/useBattery'
import { useSettings } from '../state/settings'

interface StatusBarProps {
  onOpenNotifications: () => void
  onOpenControlCenter: () => void
  usbConnected: boolean
  hideClock?: boolean
}

export function StatusBar({ onOpenNotifications, onOpenControlCenter, usbConnected, hideClock }: StatusBarProps) {
  const { settings } = useSettings()
  const now = useNow(10000)
  const battery = useBattery()
  const leftSwipe = useSwipe('down', onOpenNotifications, 24)
  const rightSwipe = useSwipe('down', onOpenControlCenter, 24)

  const BatteryIcon = battery.charging
    ? BatteryCharging
    : battery.level === null || battery.level > 70
      ? BatteryFull
      : battery.level > 25
        ? BatteryMedium
        : BatteryLow

  return (
    <header className="status-bar">
      <button type="button" className="status-bar__zone status-bar__zone--left" onClick={onOpenNotifications} aria-label="Open Notification Center" {...leftSwipe}>
        <span className="status-bar__time" aria-hidden={hideClock}>
          {hideClock ? '' : formatClock(now, settings.use24h)}
        </span>
        {settings.focus && <Moon className="status-bar__icon" aria-label="Focus on" />}
      </button>
      <button type="button" className="status-bar__zone status-bar__zone--right" onClick={onOpenControlCenter} aria-label="Open Control Center" {...rightSwipe}>
        {usbConnected && <Usb className="status-bar__icon" aria-label="USB key connected" />}
        {settings.airplane ? (
          <Plane className="status-bar__icon" aria-label="Airplane mode" />
        ) : (
          <>
            {settings.cellular && <SignalHigh className="status-bar__icon" aria-label="Cellular on" />}
            {settings.wifi && <Wifi className="status-bar__icon" aria-label="Wi-Fi on" />}
          </>
        )}
        {settings.bluetooth && !settings.airplane && <Bluetooth className="status-bar__icon status-bar__icon--small" aria-label="Bluetooth on" />}
        {battery.level !== null && <span className="status-bar__battery-text">{battery.level}</span>}
        <BatteryIcon className="status-bar__icon status-bar__icon--battery" aria-label={battery.level !== null ? `Battery ${battery.level}%` : 'Battery'} />
      </button>
    </header>
  )
}
