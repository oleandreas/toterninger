import { describe, it, expect, beforeEach } from 'vitest'
import { getLastSession, saveLastSession, clearLastSession } from '../../src/lastSession'

describe('lastSession', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a saved session', () => {
    saveLastSession('123-456-789', 'Kari')
    expect(getLastSession()).toEqual({ sessionId: '123-456-789', name: 'Kari' })
  })

  it('returns null when nothing is saved', () => {
    expect(getLastSession()).toBeNull()
  })

  it('ignores corrupt or wrongly shaped data', () => {
    localStorage.setItem('toterninger-lastSession', '{not json')
    expect(getLastSession()).toBeNull()
    localStorage.setItem('toterninger-lastSession', JSON.stringify({ sessionId: 42 }))
    expect(getLastSession()).toBeNull()
  })

  it('clears the saved session', () => {
    saveLastSession('123-456-789', 'Kari')
    clearLastSession()
    expect(getLastSession()).toBeNull()
  })
})
