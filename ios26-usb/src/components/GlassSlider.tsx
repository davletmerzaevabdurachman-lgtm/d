import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import type { LucideIcon } from 'lucide-react'

interface GlassSliderProps {
  value: number
  onChange: (value: number) => void
  label: string
  icon: LucideIcon
  className?: string
}

export function GlassSlider({ value, onChange, label, icon: Icon, className = '' }: GlassSliderProps) {
  const ref = useRef<HTMLDivElement>(null)

  const setFromPointer = (clientY: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = Math.min(1, Math.max(0, (rect.bottom - clientY) / rect.height))
    onChange(Math.round(ratio * 100))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 20, PageDown: -20 }
    if (event.key in steps) {
      event.preventDefault()
      onChange(Math.min(100, Math.max(0, value + steps[event.key])))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      onChange(event.key === 'Home' ? 0 : 100)
    }
  }

  return (
    <div
      ref={ref}
      className={`cc-slider glass ${className}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%`}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        setFromPointer(event.clientY)
      }}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event.clientY)
      }}
      onKeyDown={onKeyDown}
    >
      <span className="cc-slider__fill" style={{ height: `${value}%` }} />
      <Icon className="cc-slider__icon" aria-hidden />
    </div>
  )
}
