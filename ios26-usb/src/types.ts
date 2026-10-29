export type AppId = 'settings' | 'notes' | 'calculator' | 'clock' | 'photos' | 'calendar'

export type WallpaperId = 'aurora' | 'dune' | 'ocean' | 'graphite'

export interface UsbConfig {
  required: boolean
  strategy: 'termux' | 'webusb' | 'any'
  device: {
    name: string
    vendorId: string | null
    productId: string | null
    serialNumber: string | null
  }
  recheckIntervalSeconds: number
  lockOnRemoval: boolean
  allowDemoMode: boolean
}

export interface UsbDeviceInfo {
  path: string
  vendorId?: string
  productId?: string
  error?: string
}

export interface UsbStatus {
  ok: boolean
  method: 'termux-usb' | 'sysfs' | 'disabled' | 'none'
  checkedAt: string
  reason?: string
  devices?: UsbDeviceInfo[]
  matched?: UsbDeviceInfo
  deferToBrowser?: boolean
  available?: boolean
}

export type NotificationActionKind = 'open' | 'markRead' | 'dismiss'

export interface NotificationAction {
  label: string
  kind: NotificationActionKind
}

export interface AppNotification {
  id: string
  appId: AppId | 'system'
  title: string
  body: string
  time: number
  read: boolean
  actions?: NotificationAction[]
}

export interface Note {
  id: string
  text: string
  updatedAt: number
}
