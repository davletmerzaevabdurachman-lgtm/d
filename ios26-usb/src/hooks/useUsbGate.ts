import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '../lib/api'
import type { UsbConfig, UsbStatus } from '../types'

const FALLBACK_CONFIG: UsbConfig = {
  required: true,
  strategy: 'webusb',
  device: { name: 'USB key', vendorId: null, productId: null, serialNumber: null },
  recheckIntervalSeconds: 5,
  lockOnRemoval: true,
  allowDemoMode: false,
}

function webUsbFilters(config: UsbConfig): USBDeviceFilter[] {
  const filter: USBDeviceFilter = {}
  if (config.device.vendorId) filter.vendorId = parseInt(config.device.vendorId, 16)
  if (config.device.productId) filter.productId = parseInt(config.device.productId, 16)
  if (config.device.serialNumber) filter.serialNumber = config.device.serialNumber
  return Object.keys(filter).length ? [filter] : []
}

function matches(device: USBDevice, config: UsbConfig) {
  return webUsbFilters(config).every(
    (f) =>
      (f.vendorId === undefined || f.vendorId === device.vendorId) &&
      (f.productId === undefined || f.productId === device.productId) &&
      (f.serialNumber === undefined || f.serialNumber === device.serialNumber),
  )
}

export interface WebUsbState {
  supported: boolean
  device: { name: string; vendorId: string; productId: string } | null
  error: string | null
}

export function useUsbGate() {
  const { data: serverConfig, error: configError } = useSWR<UsbConfig>('/api/config', fetcher, {
    revalidateOnFocus: false,
  })
  const config = serverConfig ?? (configError ? FALLBACK_CONFIG : undefined)
  const serverReachable = Boolean(serverConfig)

  const { data: status, error: statusError, isValidating, mutate } = useSWR<UsbStatus>(
    serverReachable && config?.strategy !== 'webusb' ? '/api/usb' : null,
    fetcher,
    { refreshInterval: (config?.recheckIntervalSeconds ?? 5) * 1000, keepPreviousData: true },
  )

  const supported = typeof navigator !== 'undefined' && Boolean(navigator.usb)
  const [webUsb, setWebUsb] = useState<WebUsbState>({ supported, device: null, error: null })

  const refreshWebUsb = useCallback(async () => {
    if (!navigator.usb || !config) return
    try {
      const devices = await navigator.usb.getDevices()
      const found = devices.find((d) => matches(d, config))
      setWebUsb((s) => ({
        ...s,
        error: null,
        device: found
          ? {
              name: found.productName || found.manufacturerName || 'USB device',
              vendorId: found.vendorId.toString(16).padStart(4, '0'),
              productId: found.productId.toString(16).padStart(4, '0'),
            }
          : null,
      }))
    } catch (error) {
      setWebUsb((s) => ({ ...s, error: (error as Error).message }))
    }
  }, [config])

  useEffect(() => {
    if (!navigator.usb || !config || config.strategy === 'termux') return
    void refreshWebUsb()
    const onChange = () => void refreshWebUsb()
    navigator.usb.addEventListener('connect', onChange)
    navigator.usb.addEventListener('disconnect', onChange)
    return () => {
      navigator.usb?.removeEventListener('connect', onChange)
      navigator.usb?.removeEventListener('disconnect', onChange)
    }
  }, [config, refreshWebUsb])

  const pairWebUsb = useCallback(async () => {
    if (!navigator.usb || !config) return
    try {
      await navigator.usb.requestDevice({ filters: webUsbFilters(config) })
      await refreshWebUsb()
    } catch (error) {
      const message = (error as Error).name === 'NotFoundError' ? 'No device was selected.' : (error as Error).message
      setWebUsb((s) => ({ ...s, error: message }))
    }
  }, [config, refreshWebUsb])

  const browserAllowed = config ? config.strategy !== 'termux' : false
  const verified = config ? !config.required || Boolean(status?.ok) || (browserAllowed && Boolean(webUsb.device)) : false

  return {
    ready: Boolean(config),
    config: config ?? FALLBACK_CONFIG,
    serverReachable,
    status,
    statusError: statusError as Error | undefined,
    checking: isValidating,
    webUsb,
    browserAllowed,
    verified,
    verifiedVia: status?.ok ? status.method : webUsb.device ? 'webusb' : null,
    recheck: () => {
      void mutate()
      void refreshWebUsb()
    },
    pairWebUsb,
  }
}

export type UsbGate = ReturnType<typeof useUsbGate>
