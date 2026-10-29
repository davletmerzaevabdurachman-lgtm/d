import { checkUsb, loadConfig } from '../lib/usb-check.mjs'

// --list: inspect every attached device and print its vendor/product IDs so you
// can copy them into usb.config.json. It does this by matching against an ID
// that can never exist, which forces the checker to open each device.
const listMode = process.argv.includes('--list')

try {
  const config = await loadConfig()
  if (listMode) {
    config.required = true
    config.strategy = 'termux'
    config.device.vendorId = 'list-all-devices'
  }
  const result = await checkUsb(config)

  console.log(`Method:  ${result.method}`)
  if (!listMode) console.log(`Status:  ${result.ok ? 'VERIFIED' : 'NOT VERIFIED'}`)
  if (result.reason && !listMode) console.log(`Reason:  ${result.reason}`)
  if (listMode && result.available === false) console.log(`Reason:  ${result.reason}`)

  if (result.devices?.length) {
    console.log('Devices:')
    for (const device of result.devices) {
      const ids = device.vendorId ? `  vendorId="${device.vendorId}" productId="${device.productId}"` : ''
      console.log(`  - ${device.path}${ids}${device.error ? `  (error: ${device.error})` : ''}`)
    }
  } else if (listMode) {
    console.log('No USB devices attached.')
  }

  if (!listMode && result.ok && !config.device.vendorId) {
    console.log('\nTip: any USB device currently unlocks the app. Run "npm run check-usb -- --list"')
    console.log('     and copy your device IDs into usb.config.json to require one specific key.')
  }
  process.exit(result.ok || listMode ? 0 : 2)
} catch (error) {
  console.error(`USB check failed: ${error.message}`)
  process.exit(1)
}
