import useSWR from 'swr'
import { BatteryCharging, NotebookPen, Smartphone, Usb } from 'lucide-react'
import { fetcher } from '../lib/api'
import { useBattery } from '../hooks/useBattery'
import { useNow } from '../hooks/useNow'
import type { AppId, Note } from '../types'

type OpenApp = (id: AppId, origin: DOMRect | null) => void

export function CalendarWidget({ onOpen }: { onOpen: OpenApp }) {
  const now = useNow(60000)
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <button type="button" className="widget widget--small glass" aria-label="Open Calendar" onClick={(e) => onOpen('calendar', e.currentTarget.getBoundingClientRect())}>
      <span className="widget__eyebrow widget__eyebrow--red">{now.toLocaleDateString([], { month: 'long' }).toUpperCase()}</span>
      <span className="mini-calendar" aria-hidden>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`h${i}`} className="mini-calendar__head">{d}</span>
        ))}
        {cells.map((day, i) => (
          <span key={i} className={day === now.getDate() ? 'mini-calendar__today' : ''}>{day ?? ''}</span>
        ))}
      </span>
    </button>
  )
}

export function BatteryWidget({ usbName, usbConnected }: { usbName: string; usbConnected: boolean }) {
  const battery = useBattery()
  const level = battery.level ?? 0
  const circumference = 2 * Math.PI * 26

  return (
    <div className="widget widget--small glass" role="group" aria-label="Batteries and USB">
      <span className="widget__eyebrow">BATTERIES</span>
      <div className="battery-widget">
        <div className="battery-ring">
          <svg viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="32" r="26" className="battery-ring__track" />
            <circle
              cx="32"
              cy="32"
              r="26"
              className="battery-ring__value"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - level / 100)}
            />
          </svg>
          {battery.charging ? <BatteryCharging aria-hidden /> : <Smartphone aria-hidden />}
          <span className="battery-ring__label">{battery.level === null ? '--' : `${battery.level}%`}</span>
        </div>
        <div className="battery-ring">
          <svg viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="32" r="26" className="battery-ring__track" />
            <circle cx="32" cy="32" r="26" className={`battery-ring__value ${usbConnected ? '' : 'is-off'}`} strokeDasharray={circumference} strokeDashoffset={usbConnected ? 0 : circumference} />
          </svg>
          <Usb aria-hidden />
          <span className="battery-ring__label">{usbConnected ? 'Key' : 'Off'}</span>
        </div>
      </div>
      <span className="widget__caption">{usbConnected ? usbName : 'USB key not detected'}</span>
    </div>
  )
}

export function NotesWidget({ onOpen }: { onOpen: OpenApp }) {
  const { data: notes } = useSWR<Note[]>('/api/notes', fetcher)
  const latest = [...(notes ?? [])].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 2)

  return (
    <button type="button" className="widget widget--medium glass" aria-label="Open Notes" onClick={(e) => onOpen('notes', e.currentTarget.getBoundingClientRect())}>
      <span className="widget__eyebrow widget__eyebrow--yellow">
        <NotebookPen aria-hidden /> NOTES
      </span>
      {latest.length === 0 ? (
        <span className="widget__empty">No notes yet. Tap to write your first note.</span>
      ) : (
        <span className="notes-widget">
          {latest.map((note) => {
            const [title, ...rest] = note.text.split('\n')
            return (
              <span key={note.id} className="notes-widget__item">
                <strong>{title || 'New Note'}</strong>
                <span>{rest.join(' ').trim() || 'No additional text'}</span>
              </span>
            )
          })}
        </span>
      )}
    </button>
  )
}
