import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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

const { settings } = useSettings()

// Number of mounted game views (multiplayer, pass-and-play, Flip 7) that want the screen on
const gameHolds = ref(0)

export const wakeLockWanted = computed(
  () => settings.keepAwake || (settings.keepAwakeInGame && gameHolds.value > 0),
)

let sentinel: WakeLockSentinelLike | null = null
let pending = false

async function acquire() {
  // The API rejects unless the document is visible, so skip and retry on visibilitychange
  if (!wakeLockApi || sentinel || pending || document.visibilityState !== 'visible') return
  pending = true
  try {
    const lock = await wakeLockApi.request('screen')
    if (!wakeLockWanted.value) {
      await lock.release()
      return
    }
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
  watch(wakeLockWanted, (wanted) => {
    if (wanted) acquire()
    else release()
  }, { immediate: true })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wakeLockWanted.value) acquire()
  })
}

/** Keep the screen on while the calling component is mounted (if `keepAwakeInGame` is on). */
export function useGameWakeLock() {
  onMounted(() => { gameHolds.value++ })
  onUnmounted(() => { gameHolds.value-- })
}

/** Quick toggle for in-game headers: turns the effective keep-awake state on or off. */
export function toggleGameWakeLock() {
  if (wakeLockWanted.value) {
    settings.keepAwake = false
    settings.keepAwakeInGame = false
  } else {
    settings.keepAwakeInGame = true
  }
}

export function useWakeLock() {
  return { wakeLockSupported, wakeLockActive, wakeLockWanted }
}
