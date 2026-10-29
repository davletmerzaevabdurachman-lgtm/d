import useSWR from 'swr'
import { fetcher } from '../lib/api'

export interface BatteryInfo {
  level: number | null
  charging: boolean
  source: 'termux' | 'browser' | 'unknown'
}

async function loadBattery(): Promise<BatteryInfo> {
  try {
    const data = await fetcher<{ level: number; charging: boolean }>('/api/system/battery')
    return { level: data.level, charging: data.charging, source: 'termux' }
  } catch {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery()
      return { level: Math.round(battery.level * 100), charging: battery.charging, source: 'browser' }
    }
    return { level: null, charging: false, source: 'unknown' }
  }
}

export function useBattery() {
  const { data } = useSWR('battery', loadBattery, { refreshInterval: 60000, revalidateOnFocus: true })
  return data ?? { level: null, charging: false, source: 'unknown' as const }
}
