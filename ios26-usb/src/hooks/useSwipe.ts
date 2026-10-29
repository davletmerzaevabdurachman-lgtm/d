import { useRef, type PointerEvent } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right'

export function useSwipe(direction: Direction, onSwipe: () => void, threshold = 40) {
  const start = useRef<{ x: number; y: number } | null>(null)

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      start.current = { x: event.clientX, y: event.clientY }
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const origin = start.current
      start.current = null
      if (!origin) return
      const dx = event.clientX - origin.x
      const dy = event.clientY - origin.y
      const vertical = Math.abs(dy) > Math.abs(dx)
      const matched =
        (direction === 'up' && vertical && -dy > threshold) ||
        (direction === 'down' && vertical && dy > threshold) ||
        (direction === 'left' && !vertical && -dx > threshold) ||
        (direction === 'right' && !vertical && dx > threshold)
      if (matched) onSwipe()
    },
    onPointerCancel() {
      start.current = null
    },
  }
}
