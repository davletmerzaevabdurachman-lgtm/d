import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { APPS } from '../lib/apps'
import type { AppId } from '../types'
import { CalculatorApp } from '../apps/CalculatorApp'
import { CalendarApp } from '../apps/CalendarApp'
import { ClockApp } from '../apps/ClockApp'
import { NotesApp } from '../apps/NotesApp'
import { PhotosApp } from '../apps/PhotosApp'
import { SettingsApp, type SettingsAppProps } from '../apps/SettingsApp'

interface AppWindowProps {
  id: AppId
  origin: DOMRect | null
  closing: boolean
  reduceMotion: boolean
  onClosed: () => void
  settingsProps: SettingsAppProps
}

const ANIMATION_MS = 420

export function AppWindow({ id, origin, closing, reduceMotion, onClosed, settingsProps }: AppWindowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(reduceMotion)
  const [collapsedStyle, setCollapsedStyle] = useState<CSSProperties>({ opacity: 0, transform: 'scale(0.9)' })

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement?.getBoundingClientRect()
    if (origin && parent) {
      const sx = origin.width / parent.width
      const sy = origin.height / parent.height
      setCollapsedStyle({
        transform: `translate(${origin.left - parent.left}px, ${origin.top - parent.top}px) scale(${sx}, ${sy})`,
        borderRadius: `${22 / sx}px / ${22 / sy}px`,
        opacity: 0.2,
      })
    }
    if (!reduceMotion) {
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)))
      return () => cancelAnimationFrame(frame)
    }
  }, [origin, reduceMotion])

  useEffect(() => {
    if (!closing) return
    setExpanded(false)
    const timeout = window.setTimeout(onClosed, reduceMotion ? 0 : ANIMATION_MS)
    return () => window.clearTimeout(timeout)
  }, [closing, reduceMotion, onClosed])

  const content: Record<AppId, ReactNode> = {
    settings: <SettingsApp {...settingsProps} />,
    notes: <NotesApp />,
    calculator: <CalculatorApp />,
    clock: <ClockApp />,
    photos: <PhotosApp />,
    calendar: <CalendarApp />,
  }

  return (
    <div
      ref={ref}
      className={`app-window ${expanded ? 'is-expanded' : ''} app-window--${id}`}
      style={expanded ? undefined : collapsedStyle}
      role="dialog"
      aria-modal="true"
      aria-label={APPS[id].name}
    >
      <div className="app-window__content">{content[id]}</div>
    </div>
  )
}
