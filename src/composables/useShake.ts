import { onMounted, onUnmounted, watch } from 'vue'
import { useSettings } from './useSettings'

const SHAKE_THRESHOLD = 15
const SHAKE_TIMEOUT = 1000

export function useShake(onShake: () => void) {
  const { settings } = useSettings()

  let lastX = 0
  let lastY = 0
  let lastZ = 0
  let lastTime = 0
  let lastShake = 0
  let listening = false
  let permissionGranted = false

  function handleMotion(e: DeviceMotionEvent) {
    const acc = e.accelerationIncludingGravity
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return

    const now = Date.now()
    const timeDiff = now - lastTime

    if (timeDiff < 100) return
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

  async function requestPermissionAndStart() {
    if (!('DeviceMotionEvent' in window)) return

    const DME = DeviceMotionEvent as any
    if (typeof DME.requestPermission === 'function') {
      try {
        const perm = await DME.requestPermission()
        if (perm === 'granted') {
          permissionGranted = true
          startListening()
        }
      } catch {}
    } else {
      permissionGranted = true
      startListening()
    }
  }

  onMounted(() => {
    // On iOS, permission must be requested from a user gesture.
    // We attach a one-time click handler that requests permission
    // when shakeToRoll is enabled.
    if (!('DeviceMotionEvent' in window)) return

    const DME = DeviceMotionEvent as any
    if (typeof DME.requestPermission === 'function') {
      document.addEventListener('click', async function requestPerm() {
        if (!settings.shakeToRoll) return
        try {
          const perm = await DME.requestPermission()
          if (perm === 'granted') {
            permissionGranted = true
            if (settings.shakeToRoll) startListening()
          }
        } catch {}
        document.removeEventListener('click', requestPerm)
      }, { once: true })
    } else {
      permissionGranted = true
    }

    // Start immediately if setting is on and no permission needed
    if (settings.shakeToRoll && permissionGranted) {
      startListening()
    }
  })

  watch(() => settings.shakeToRoll, (enabled) => {
    if (enabled) {
      if (permissionGranted) {
        startListening()
      } else {
        requestPermissionAndStart()
      }
    } else {
      stopListening()
    }
  })

  onUnmounted(() => {
    stopListening()
  })
}
