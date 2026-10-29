import { useEffect, useState } from 'react'

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function formatClock(date: Date, use24h: boolean) {
  return date
    .toLocaleTimeString([], { hour: use24h ? '2-digit' : 'numeric', minute: '2-digit', hour12: !use24h })
    .replace(/\s?[AP]\.?M\.?$/i, '')
}

export function formatLongDate(date: Date) {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

export function formatRelative(time: number, now: number) {
  const minutes = Math.round((now - time) / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(time).toLocaleDateString()
}
