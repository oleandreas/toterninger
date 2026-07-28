import { ref, watch } from 'vue'
import { useSettings } from './useSettings'

interface WakeLockSentinelLike {
  release(): Promise<void>
  addEventListener(type: 'release', listener: () => void): void
}

const wakeLockApi = (navigator as unknown as {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> }
}).wakeLock

export const wakeLockSupported = !!wakeLockApi
export const wakeLockActive = ref(false)

let sentinel: WakeLockSentinelLike | null = null
let pending = false

async function acquire() {
  // The API rejects unless the document is visible, so skip and retry on visibilitychange
  if (!wakeLockApi || sentinel || pending || document.visibilityState !== 'visible') return
  pending = true
  try {
    const lock = await wakeLockApi.request('screen')
    sentinel = lock
    wakeLockActive.value = true
    // The browser releases the lock on its own when the tab is hidden
    lock.addEventListener('release', () => {
      if (sentinel === lock) {
        sentinel = null
        wakeLockActive.value = false
      }
    })
  } catch {
    sentinel = null
    wakeLockActive.value = false
  } finally {
    pending = false
  }
}

async function release() {
  const lock = sentinel
  sentinel = null
  wakeLockActive.value = false
  if (!lock) return
  try {
    await lock.release()
  } catch {}
}

if (wakeLockSupported) {
  const { settings } = useSettings()

  watch(() => settings.keepAwake, (enabled) => {
    if (enabled) acquire()
    else release()
  }, { immediate: true })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && settings.keepAwake) acquire()
  })
}

export function useWakeLock() {
  return { wakeLockSupported, wakeLockActive }
}
