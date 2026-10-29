import type { ReactNode } from 'react'
import {
  Bluetooth,
  Calculator,
  Flashlight,
  Lock,
  Moon,
  Plane,
  Settings as Gear,
  SignalHigh,
  Sun,
  SunMoon,
  Timer,
  Usb,
  Volume2,
  Wifi,
} from 'lucide-react'
import { useSwipe } from '../hooks/useSwipe'
import { useSettings } from '../state/settings'
import { useSystemActions, useSystemError } from '../state/system'
import { useTimer } from '../state/timer'
import { GlassSlider } from './GlassSlider'
import type { AppId } from '../types'

interface ControlCenterProps {
  open: boolean
  onClose: () => void
  onLock: () => void
  onOpenApp: (id: AppId) => void
  usbConnected: boolean
  usbName: string
  usbMethod: string | null
}

function Toggle({ active, label, onClick, children, className = '' }: { active: boolean; label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={`cc-toggle ${active ? 'is-active' : ''} ${className}`} aria-pressed={active} aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

export function ControlCenter({ open, onClose, onLock, onOpenApp, usbConnected, usbName, usbMethod }: ControlCenterProps) {
  const { settings, update } = useSettings()
  const { setBrightness, setVolume, setTorch, setWifi, vibrate } = useSystemActions()
  const { error } = useSystemError()
  const timer = useTimer()
  const swipe = useSwipe('up', onClose, 50)

  const tap = (fn: () => void) => () => {
    if (settings.haptics) vibrate()
    fn()
  }

  return (
    <div className={`overlay cc ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden={!open} inert={!open}>
      <div className="cc__panel" role="dialog" aria-modal="true" aria-label="Control Center" onClick={(e) => e.stopPropagation()} {...swipe}>
        <div className="cc-grid">
          <div className="cc-block cc-block--connectivity glass glass-refract">
            <Toggle active={settings.airplane} label="Airplane Mode" className="is-orange" onClick={tap(() => update({ airplane: !settings.airplane }))}>
              <Plane aria-hidden />
            </Toggle>
            <Toggle active={settings.cellular && !settings.airplane} label="Cellular Data" className="is-green" onClick={tap(() => update({ cellular: !settings.cellular }))}>
              <SignalHigh aria-hidden />
            </Toggle>
            <Toggle active={settings.wifi && !settings.airplane} label="Wi-Fi" onClick={tap(() => setWifi(!settings.wifi))}>
              <Wifi aria-hidden />
            </Toggle>
            <Toggle active={settings.bluetooth && !settings.airplane} label="Bluetooth" onClick={tap(() => update({ bluetooth: !settings.bluetooth }))}>
              <Bluetooth aria-hidden />
            </Toggle>
          </div>

          <div className={`cc-block cc-block--usb glass glass-refract ${usbConnected ? 'is-connected' : ''}`} role="status">
            <Usb aria-hidden />
            <strong>{usbConnected ? 'USB Key' : 'No USB Key'}</strong>
            <span>{usbConnected ? `${usbName}${usbMethod ? ` · ${usbMethod}` : ''}` : 'Connect via OTG'}</span>
          </div>

          <button type="button" className={`cc-pill glass ${settings.focus ? 'is-active' : ''}`} aria-pressed={settings.focus} onClick={tap(() => update({ focus: !settings.focus }))}>
            <span className="cc-pill__icon">
              <Moon aria-hidden />
            </span>
            <span>
              <strong>Focus</strong>
              <small>{settings.focus ? 'Do Not Disturb' : 'Off'}</small>
            </span>
          </button>

          <GlassSlider className="cc-slider--brightness" value={settings.brightness} onChange={setBrightness} label="Brightness" icon={Sun} />
          <GlassSlider className="cc-slider--volume" value={settings.volume} onChange={setVolume} label="Volume" icon={Volume2} />

          <Toggle active={settings.torch} label="Flashlight" className="cc-tile glass" onClick={tap(() => setTorch(!settings.torch))}>
            <Flashlight aria-hidden />
          </Toggle>
          <Toggle
            active={settings.appearance === 'dark'}
            label="Dark Mode"
            className="cc-tile glass"
            onClick={tap(() => update({ appearance: settings.appearance === 'dark' ? 'light' : 'dark' }))}
          >
            <SunMoon aria-hidden />
          </Toggle>

          <Toggle
            active={timer.endsAt !== null}
            label={timer.endsAt ? 'Timer running, open Clock' : 'Start 5 minute timer'}
            className="cc-tile glass"
            onClick={tap(() => {
              if (timer.endsAt) onOpenApp('clock')
              else timer.start(5 * 60 * 1000)
            })}
          >
            <Timer aria-hidden />
          </Toggle>
          <Toggle active={false} label="Calculator" className="cc-tile glass" onClick={tap(() => onOpenApp('calculator'))}>
            <Calculator aria-hidden />
          </Toggle>
          <Toggle active={false} label="Lock Screen" className="cc-tile glass" onClick={tap(onLock)}>
            <Lock aria-hidden />
          </Toggle>
          <Toggle active={false} label="Settings" className="cc-tile glass" onClick={tap(() => onOpenApp('settings'))}>
            <Gear aria-hidden />
          </Toggle>
        </div>
        {settings.syncAndroid && error && (
          <p className="cc__error" role="alert">
            {`Android sync: ${error}`}
          </p>
        )}
      </div>
    </div>
  )
}
