import { defineConfig, type ProxyOptions } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { networkInterfaces } from 'node:os'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

const EMULATOR_TARGET = 'http://127.0.0.1:8080'

// Firestore Web SDK endpoints: WebChannel streams + REST calls
const emulatorProxy: Record<string, ProxyOptions> = {
  '/google.firestore.v1.Firestore': { target: EMULATOR_TARGET, ws: true },
  '/v1/projects': { target: EMULATOR_TARGET },
}

// Prefer home-network ranges over VPN/CGNAT addresses (e.g. Tailscale's 100.x); override with DEMO_HOST
function lanAddress(): string | undefined {
  if (process.env.DEMO_HOST) return process.env.DEMO_HOST
  const addresses = Object.values(networkInterfaces())
    .flatMap(list => list ?? [])
    .filter(net => net.family === 'IPv4' && !net.internal)
    .map(net => net.address)
  const isPrivate = (a: string) => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a)
  return addresses.find(isPrivate) ?? addresses.find(a => !a.startsWith('169.254.'))
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const useEmulator = mode === 'emulator' || mode === 'demo'
  const isDemo = mode === 'demo'

  return {
    base: '/',
    plugins: [vue(), ...(isDemo ? [basicSsl()] : [])],
    define: {
      // Lets the lobby show a QR code phones can reach even if the host opened localhost
      'import.meta.env.VITE_LAN_HOST': JSON.stringify(isDemo ? lanAddress() ?? '' : ''),
    },
    server: useEmulator
      ? { host: isDemo ? true : undefined, proxy: emulatorProxy }
      : undefined,
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          flip7: fileURLToPath(new URL('./flip7/index.html', import.meta.url)),
        },
      },
    },
  }
})
