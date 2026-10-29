import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AppNotification } from '../types'

type NewNotification = Omit<AppNotification, 'id' | 'time' | 'read'>

interface NotificationsContextValue {
  notifications: AppNotification[]
  push: (notification: NewNotification) => void
  dismiss: (id: string) => void
  markRead: (id: string) => void
  clearAll: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

const WELCOME: AppNotification = {
  id: 'welcome',
  appId: 'system',
  title: 'Welcome to Glass 26',
  body: 'Swipe down from the top-left for notifications, top-right for Control Center, and swipe up from the bottom bar to go home.',
  time: Date.now(),
  read: false,
  actions: [
    { label: 'Open Settings', kind: 'open' },
    { label: 'Mark as Read', kind: 'markRead' },
  ],
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([WELCOME])

  const push = useCallback((notification: NewNotification) => {
    setNotifications((current) => [
      { ...notification, id: crypto.randomUUID(), time: Date.now(), read: false },
      ...current,
    ].slice(0, 50))
  }, [])
  const dismiss = useCallback((id: string) => setNotifications((current) => current.filter((n) => n.id !== id)), [])
  const markRead = useCallback(
    (id: string) => setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [],
  )
  const clearAll = useCallback(() => setNotifications([]), [])

  const value = useMemo(
    () => ({ notifications, push, dismiss, markRead, clearAll }),
    [notifications, push, dismiss, markRead, clearAll],
  )
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationsProvider')
  return context
}
