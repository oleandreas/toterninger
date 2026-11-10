import { describe, it, expect, beforeEach, vi } from 'vitest'

async function loadRouter(hash: string) {
  window.location.hash = hash
  vi.resetModules()
  return import('../../src/router')
}

describe('router', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('parses home for an empty hash', async () => {
    const { useRouter } = await loadRouter('')
    expect(useRouter().route.value).toEqual({ name: 'home' })
  })

  it('parses a session hash', async () => {
    const { useRouter } = await loadRouter('#/session/123-456-789')
    expect(useRouter().route.value).toEqual({ name: 'session', sessionId: '123-456-789' })
  })

  it('parses the local pass-and-play route', async () => {
    const { useRouter } = await loadRouter('#/lokal')
    expect(useRouter().route.value).toEqual({ name: 'local' })
  })

  it('falls back to home for malformed session ids', async () => {
    const { useRouter } = await loadRouter('#/session/12-345')
    expect(useRouter().route.value).toEqual({ name: 'home' })
  })

  it('navigate() writes the hash for each route', async () => {
    const { useRouter } = await loadRouter('')
    const { navigate } = useRouter()
    navigate({ name: 'session', sessionId: '111-222-333' })
    expect(window.location.hash).toBe('#/session/111-222-333')
    navigate({ name: 'local' })
    expect(window.location.hash).toBe('#/lokal')
  })

  it('generateSessionId() yields NNN-NNN-NNN', async () => {
    const { generateSessionId } = await loadRouter('')
    for (let i = 0; i < 200; i++) {
      expect(generateSessionId()).toMatch(/^\d{3}-\d{3}-\d{3}$/)
    }
  })
})
