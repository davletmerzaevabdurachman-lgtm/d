import { readSync } from 'node:fs'

const fd = Number(process.argv[2])
if (!Number.isInteger(fd) || fd < 0) {
  console.log(JSON.stringify({ error: 'No USB file descriptor received from termux-usb.' }))
  process.exit(1)
}

try {
  // Reading a usbfs node returns the cached descriptors; the first 18 bytes are
  // the standard USB device descriptor (idVendor @ 8, idProduct @ 10, little-endian).
  const buffer = Buffer.alloc(18)
  const bytes = readSync(fd, buffer, 0, 18, 0)
  if (bytes < 12 || buffer[1] !== 0x01) throw new Error(`Unexpected descriptor (${bytes} bytes)`)
  const hex = (n) => n.toString(16).padStart(4, '0')
  console.log(
    JSON.stringify({
      vendorId: hex(buffer.readUInt16LE(8)),
      productId: hex(buffer.readUInt16LE(10)),
      usbVersion: hex(buffer.readUInt16LE(2)),
    }),
  )
} catch (error) {
  console.log(JSON.stringify({ error: error.message }))
  process.exit(1)
}
