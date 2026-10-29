import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error - plain ESM module shared with server.mjs
import { handleApiRequest } from './lib/usb-check.mjs'

function usbApi(): Plugin {
  const attach = (middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => void }) => {
    middlewares.use((req, res, next) => {
      handleApiRequest(req, res)
        .then((handled: boolean) => {
          if (!handled) next()
        })
        .catch(next)
    })
  }
  return {
    name: 'usb-api',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}

export default defineConfig({
  plugins: [react(), usbApi()],
  server: { port: 5173, host: '0.0.0.0', allowedHosts: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
})
