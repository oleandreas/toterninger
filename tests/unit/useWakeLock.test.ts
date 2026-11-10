import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

function installFakeWakeLock() {
  const sentinels: { released: boolean; release(): Promise<void> }[] = []
  const request = vi.fn(async () => {
    const listeners: (() => void)[] = []
    const s = {
      released: false,
      async release() {
        s.released = true
        listeners.forEach(l => l())
      },
      addEventListener(_: 'release', l: () => void) { listeners.push(l) },
    }
    sentinels.push(s)
    return s
  })
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, sentinels }
}

async function load() {
  vi.resetModules()
  const wake = await import('../../src/composables/useWakeLock')
  const { settings } = (await import('../../src/composables/useSettings')).useSettings()
  return { wake, settings }
}

const flush = async () => {
  await nextTick()
  await new Promise(r => setTimeout(r, 0))
}

function mountGameView(useGameWakeLock: () => void) {
  const app = createApp(defineComponent({
    setup() {
      useGameWakeLock()
      return () => h('div')
    },
  }))
  app.mount(document.createElement('div'))
  return app
}

describe('useWakeLock', () => {
  beforeEach(() => localStorage.clear())

  it('does not lock outside games by default', async () => {
    const { request } = installFakeWakeLock()
    const { wake } = await load()
    await flush()
    expect(wake.wakeLockWanted.value).toBe(false)
    expect(request).not.toHaveBeenCalled()
  })

  it('locks while a game view is mounted and releases afterwards', async () => {
    const { request, sentinels } = installFakeWakeLock()
    const { wake } = await load()
    const app = mountGameView(wake.useGameWakeLock)
    await flush()
    expect(request).toHaveBeenCalledTimes(1)
    expect(wake.wakeLockActive.value).toBe(true)

    app.unmount()
    await flush()
    expect(sentinels[0].released).toBe(true)
    expect(wake.wakeLockActive.value).toBe(false)
  })

  it('respects keepAwakeInGame = false', async () => {
    localStorage.setItem('toterninger-settings', JSON.stringify({ keepAwakeInGame: false }))
    const { request } = installFakeWakeLock()
    const { wake } = await load()
    mountGameView(wake.useGameWakeLock)
    await flush()
    expect(request).not.toHaveBeenCalled()
  })

  it('the header toggle switches the effective state off and on', async () => {
    installFakeWakeLock()
    const { wake, settings } = await load()
    mountGameView(wake.useGameWakeLock)
    settings.keepAwake = true
    await flush()
    expect(wake.wakeLockWanted.value).toBe(true)

    wake.toggleGameWakeLock()
    await flush()
    expect(settings.keepAwake).toBe(false)
    expect(settings.keepAwakeInGame).toBe(false)
    expect(wake.wakeLockActive.value).toBe(false)

    wake.toggleGameWakeLock()
    await flush()
    expect(settings.keepAwakeInGame).toBe(true)
    expect(wake.wakeLockActive.value).toBe(true)
  })

  it('re-acquires when the tab becomes visible again', async () => {
    const { request, sentinels } = installFakeWakeLock()
    const { wake } = await load()
    mountGameView(wake.useGameWakeLock)
    await flush()
    await sentinels[0].release()
    expect(wake.wakeLockActive.value).toBe(false)

    document.dispatchEvent(new Event('visibilitychange'))
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
    expect(wake.wakeLockActive.value).toBe(true)
  })
})
