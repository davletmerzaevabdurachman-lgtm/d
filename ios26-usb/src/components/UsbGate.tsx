import { useState } from 'react'
import { ChevronDown, Loader2, RefreshCw, Usb } from 'lucide-react'
import type { UsbGate as UsbGateState } from '../hooks/useUsbGate'

interface UsbGateProps {
  gate: UsbGateState
  onDemo: () => void
}

export function UsbGate({ gate, onDemo }: UsbGateProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { config, status, statusError, serverReachable, webUsb, browserAllowed } = gate

  const ids = config.device.vendorId ? `${config.device.vendorId}:${config.device.productId ?? '****'}` : 'any device'
  const message = !gate.ready
    ? 'Connecting to the local server…'
    : !serverReachable
      ? 'The local server is not running, so only browser (WebUSB) verification is available.'
      : statusError
        ? `USB check failed: ${statusError.message}`
        : status?.reason ?? (browserAllowed ? 'Plug in your USB key, then pair it below.' : 'Plug in your USB key.')

  return (
    <section className="usb-gate" aria-labelledby="usb-gate-title" aria-live="polite">
      <div className="usb-gate__card glass glass-refract">
        <div className="usb-gate__icon" aria-hidden>
          <Usb />
        </div>
        <h1 id="usb-gate-title">Connect your USB key</h1>
        <p className="usb-gate__device">
          {config.device.name} <span>{`(${ids})`}</span>
        </p>
        <p className="usb-gate__message">{message}</p>

        <div className="usb-gate__actions">
          <button type="button" className="button button--primary" onClick={gate.recheck} disabled={gate.checking}>
            {gate.checking ? <Loader2 className="spin" aria-hidden /> : <RefreshCw aria-hidden />}
            Check again
          </button>
          {browserAllowed && webUsb.supported && (
            <button type="button" className="button button--glass" onClick={() => void gate.pairWebUsb()}>
              <Usb aria-hidden />
              Pair in browser
            </button>
          )}
          {config.allowDemoMode && (
            <button type="button" className="button button--ghost" onClick={onDemo}>
              Continue without USB (demo)
            </button>
          )}
        </div>
        {webUsb.error && <p className="usb-gate__error" role="alert">{webUsb.error}</p>}

        <ol className="usb-gate__steps">
          <li>Connect the key through a USB OTG adapter.</li>
          <li>If Android asks which app may access it, choose Termux:API and tap OK.</li>
          <li>Keep Termux running in the background while you use Glass 26.</li>
        </ol>

        <button type="button" className="usb-gate__details-toggle" aria-expanded={showDetails} onClick={() => setShowDetails((s) => !s)}>
          Technical details <ChevronDown aria-hidden className={showDetails ? 'rotate' : ''} />
        </button>
        {showDetails && (
          <dl className="usb-gate__details">
            <dt>Strategy</dt>
            <dd>{config.strategy}</dd>
            <dt>Server</dt>
            <dd>{serverReachable ? 'reachable' : 'unreachable'}</dd>
            <dt>Method</dt>
            <dd>{status?.method ?? 'n/a'}</dd>
            <dt>WebUSB</dt>
            <dd>{webUsb.supported ? (webUsb.device ? `paired: ${webUsb.device.name}` : 'supported, nothing paired') : 'not supported in this browser'}</dd>
            {status?.devices?.map((d) => (
              <div key={d.path} className="usb-gate__detail-row">
                <dt>Device</dt>
                <dd>{`${d.path}${d.vendorId ? ` (${d.vendorId}:${d.productId})` : ''}${d.error ? ` - ${d.error}` : ''}`}</dd>
              </div>
            ))}
            {status?.checkedAt && (
              <>
                <dt>Last check</dt>
                <dd>{new Date(status.checkedAt).toLocaleTimeString()}</dd>
              </>
            )}
          </dl>
        )}
      </div>
    </section>
  )
}
