import { onMounted, onUnmounted } from 'vue'

const SHAKE_THRESHOLD = 15
const SHAKE_TIMEOUT = 1000

export function useShake(onShake: () => void) {
  let lastX = 0
  let lastY = 0
  let lastZ = 0
  let lastTime = 0
  let lastShake = 0

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

  onMounted(() => {
    if ('DeviceMotionEvent' in window) {
      // iOS 13+ requires permission
      const DME = DeviceMotionEvent as any
      if (typeof DME.requestPermission === 'function') {
        // Permission will be requested on first tap
        document.addEventListener('click', async function requestPerm() {
          try {
            const perm = await DME.requestPermission()
            if (perm === 'granted') {
              window.addEventListener('devicemotion', handleMotion)
            }
          } catch {}
          document.removeEventListener('click', requestPerm)
        }, { once: true })
      } else {
        window.addEventListener('devicemotion', handleMotion)
      }
    }
  })

  onUnmounted(() => {
    window.removeEventListener('devicemotion', handleMotion)
  })
}
