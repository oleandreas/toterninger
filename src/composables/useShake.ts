import { ref, onUnmounted, watch } from 'vue'
import { useSettings } from './useSettings'

const SHAKE_THRESHOLD = 15
const SHAKE_TIMEOUT = 1000

// Shared permission state across instances
// Determine initial state: if no requestPermission method, permission is not needed
const initialPermission = (() => {
  if (!('DeviceMotionEvent' in window)) return 'denied' as const
  const DME = DeviceMotionEvent as any
  if (typeof DME.requestPermission === 'function') return 'prompt' as const
  return 'not-needed' as const
})()
const permissionState = ref<'prompt' | 'granted' | 'denied' | 'not-needed'>(initialPermission)

/**
 * Request DeviceMotion permission. MUST be called from a user gesture (click/tap) on iOS.
 * Returns true if permission was granted.
 */
export async function requestShakePermission(): Promise<boolean> {
  if (!('DeviceMotionEvent' in window)) {
    permissionState.value = 'denied'
    return false
  }

  const DME = DeviceMotionEvent as any
  if (typeof DME.requestPermission === 'function') {
    try {
      const result = await DME.requestPermission()
      permissionState.value = result === 'granted' ? 'granted' : 'denied'
      return result === 'granted'
    } catch {
      permissionState.value = 'denied'
      return false
    }
  }

  // Android / desktop — no permission needed
  permissionState.value = 'not-needed'
  return true
}

export function useShake(onShake: () => void) {
  const { settings } = useSettings()

  let lastX = 0
  let lastY = 0
  let lastZ = 0
  let lastTime = 0
  let lastShake = 0
  let listening = false

  function handleMotion(e: DeviceMotionEvent) {
    const acc = e.accelerationIncludingGravity
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return

    const now = Date.now()
    if (now - lastTime < 100) return
    lastTime = now

    const deltaX = Math.abs(acc.x - lastX)
    const deltaY = Math.abs(acc.y - lastY)
    const deltaZ = Math.abs(acc.z - lastZ)

    const acceleration = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ)

    if (acceleration > SHAKE_THRESHOLD && now - lastShake > SHAKE_TIMEOUT) {
      lastShake = now
      onShake()
    }

    lastX = acc.x
    lastY = acc.y
    lastZ = acc.z
  }

  function startListening() {
    if (listening) return
    window.addEventListener('devicemotion', handleMotion)
    listening = true
  }

  function stopListening() {
    if (!listening) return
    window.removeEventListener('devicemotion', handleMotion)
    listening = false
  }

  // On load, if shakeToRoll is already on, cycle the listener off/on
  // so the browser registers the event listener fresh
  if (settings.shakeToRoll && (permissionState.value === 'granted' || permissionState.value === 'not-needed')) {
    stopListening()
    setTimeout(() => {
      if (settings.shakeToRoll) startListening()
    }, 100)
  }

  watch(() => settings.shakeToRoll, (enabled) => {
    if (enabled && (permissionState.value === 'granted' || permissionState.value === 'not-needed')) {
      startListening()
    } else {
      stopListening()
    }
  })

  watch(permissionState, (state) => {
    if (settings.shakeToRoll && (state === 'granted' || state === 'not-needed')) {
      startListening()
    }
  })

  onUnmounted(() => {
    stopListening()
  })
}
