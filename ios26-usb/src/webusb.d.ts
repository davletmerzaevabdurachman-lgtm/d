interface USBDevice {
  readonly vendorId: number
  readonly productId: number
  readonly productName?: string
  readonly manufacturerName?: string
  readonly serialNumber?: string
}

interface USBDeviceFilter {
  vendorId?: number
  productId?: number
  serialNumber?: string
}

interface USBConnectionEvent extends Event {
  readonly device: USBDevice
}

interface USB extends EventTarget {
  getDevices(): Promise<USBDevice[]>
  requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>
  addEventListener(type: 'connect' | 'disconnect', listener: (event: USBConnectionEvent) => void): void
  removeEventListener(type: 'connect' | 'disconnect', listener: (event: USBConnectionEvent) => void): void
}

interface BatteryManager extends EventTarget {
  readonly level: number
  readonly charging: boolean
}

interface Navigator {
  readonly usb?: USB
  getBattery?: () => Promise<BatteryManager>
}
