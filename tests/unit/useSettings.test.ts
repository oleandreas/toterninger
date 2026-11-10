import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'

const KEY = 'toterninger-settings'

async function loadSettings() {
  vi.resetModules()
  const mod = await import('../../src/composables/useSettings')
  return mod.useSettings().settings
}

describe('useSettings', () => {
  beforeEach(() => localStorage.clear())

  it('uses defaults when nothing is stored', async () => {
    const settings = await loadSettings()
    expect(settings.gameMode).toBe('catan')
    expect(settings.keepAwake).toBe(false)
    expect(settings.keepAwakeInGame).toBe(true)
    expect(settings.turnTimeout).toBe(30)
  })

  it('migrates the old catanMode boolean', async () => {
    localStorage.setItem(KEY, JSON.stringify({ catanMode: false }))
    const settings = await loadSettings()
    expect(settings.gameMode).toBe('standard')
    expect('catanMode' in settings).toBe(false)
  })

  it('fills in fields added after the settings were stored', async () => {
    localStorage.setItem(KEY, JSON.stringify({ theme: 'neon', sound: false }))
    const settings = await loadSettings()
    expect(settings.theme).toBe('neon')
    expect(settings.sound).toBe(false)
    expect(settings.keepAwakeInGame).toBe(true)
  })

  it('persists changes and applies the theme', async () => {
    const settings = await loadSettings()
    settings.theme = 'dark'
    await nextTick()
    expect(JSON.parse(localStorage.getItem(KEY)!).theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
