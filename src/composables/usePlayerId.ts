const STORAGE_KEY = 'toterninger-playerId'

let playerId: string | null = null

export function getPlayerId(): string {
  if (playerId) return playerId
  playerId = localStorage.getItem(STORAGE_KEY)
  if (!playerId) {
    playerId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, playerId)
  }
  return playerId
}
