import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNotifications } from './notifications'
import { useSystemActions } from './system'

interface TimerState {
  endsAt: number | null
  pausedRemaining: number | null
  durationMs: number
}

interface TimerContextValue extends TimerState {
  start: (durationMs: number) => void
  pause: () => void
  resume: () => void
  cancel: () => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>({ endsAt: null, pausedRemaining: null, durationMs: 0 })
  const { push } = useNotifications()
  const { vibrate } = useSystemActions()

  useEffect(() => {
    if (state.endsAt === null) return
    const id = window.setTimeout(() => {
      setState((s) => ({ ...s, endsAt: null, pausedRemaining: null }))
      vibrate()
      push({
        appId: 'clock',
        title: 'Timer',
        body: 'Your timer has finished.',
        actions: [
          { label: 'Open Clock', kind: 'open' },
          { label: 'Dismiss', kind: 'dismiss' },
        ],
      })
    }, Math.max(0, state.endsAt - Date.now()))
    return () => window.clearTimeout(id)
  }, [state.endsAt, push, vibrate])

  const start = useCallback((durationMs: number) => setState({ endsAt: Date.now() + durationMs, pausedRemaining: null, durationMs }), [])
  const pause = useCallback(
    () => setState((s) => (s.endsAt ? { ...s, endsAt: null, pausedRemaining: s.endsAt - Date.now() } : s)),
    [],
  )
  const resume = useCallback(
    () => setState((s) => (s.pausedRemaining !== null ? { ...s, endsAt: Date.now() + s.pausedRemaining, pausedRemaining: null } : s)),
    [],
  )
  const cancel = useCallback(() => setState({ endsAt: null, pausedRemaining: null, durationMs: 0 }), [])

  const value = useMemo(() => ({ ...state, start, pause, resume, cancel }), [state, start, pause, resume, cancel])
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) throw new Error('useTimer must be used inside TimerProvider')
  return context
}
