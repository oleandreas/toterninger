const KEY = 'toterninger-lastSession'

export interface LastSession {
  sessionId: string
  name: string
}

export function getLastSession(): LastSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.sessionId !== 'string' || typeof parsed?.name !== 'string') return null
    return { sessionId: parsed.sessionId, name: parsed.name }
  } catch {
    return null
  }
}

export function saveLastSession(sessionId: string, name: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ sessionId, name }))
  } catch {}
}

export function clearLastSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
