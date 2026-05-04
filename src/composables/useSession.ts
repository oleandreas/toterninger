import { ref, computed, onUnmounted, type Ref } from 'vue'
import { doc, setDoc, updateDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase'
import { getPlayerId } from './usePlayerId'
import { generateSessionId } from '../router'
import { useSettings, type TurnTimeout } from './useSettings'
import { saveLastSession } from '../lastSession'

export interface Player {
  id: string
  name: string
}

export interface MultiplayerRoll {
  die1: number
  die2: number
  sum: number
  timestamp: number
  rollNumber: number
  playerId: string
  playerName: string
}

export interface SessionDocument {
  hostId: string
  status: 'lobby' | 'playing'
  createdAt: number
  players: Player[]
  currentPlayerIndex: number
  rolls: MultiplayerRoll[]
  turnStartedAt: number
  heartbeats: Record<string, number>
  turnTimeout: TurnTimeout
}

const HEARTBEAT_INTERVAL = 5000
const AWAY_THRESHOLD = 15000

export function useSession() {
  const { settings } = useSettings()
  const session: Ref<SessionDocument | null> = ref(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribe: Unsubscribe | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let turnTimer: ReturnType<typeof setInterval> | null = null
  let currentSessionId = ''

  const playerId = getPlayerId()

  const isHost = computed(() => session.value?.hostId === playerId)
  const isMyTurn = computed(() => {
    if (!session.value || session.value.status !== 'playing') return false
    const idx = session.value.currentPlayerIndex
    return session.value.players[idx]?.id === playerId
  })
  const currentPlayer = computed(() => {
    if (!session.value) return null
    return session.value.players[session.value.currentPlayerIndex] ?? null
  })
  const myPlayer = computed(() => {
    if (!session.value) return null
    return session.value.players.find(p => p.id === playerId) ?? null
  })
  const hasJoined = computed(() => myPlayer.value !== null)

  // Presence: which players are away?
  const awayPlayerIds = computed<Set<string>>(() => {
    const s = session.value
    if (!s || !s.heartbeats) return new Set()
    const now = Date.now()
    const away = new Set<string>()
    for (const p of s.players) {
      const lastSeen = s.heartbeats[p.id]
      if (!lastSeen || now - lastSeen > AWAY_THRESHOLD) {
        away.add(p.id)
      }
    }
    return away
  })

  const currentPlayerAway = computed(() => {
    const cp = currentPlayer.value
    if (!cp) return false
    return awayPlayerIds.value.has(cp.id)
  })

  // Who may press the "Neste" button in the UI:
  //   - 'manual' mode: only the active player
  //   - 'admin' mode:  only the host
  //   - numeric (timer) mode: nobody (auto-advance handles it)
  const canPassTurn = computed(() => {
    const s = session.value
    if (!s || s.status !== 'playing') return false
    if (s.turnTimeout === 'manual') return isMyTurn.value
    if (s.turnTimeout === 'admin') return isHost.value
    return false
  })

  // Turn timer: seconds remaining
  const turnSecondsLeft = ref<number | null>(null)

  function startHeartbeat() {
    stopHeartbeat()
    sendHeartbeat()
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  async function sendHeartbeat() {
    if (!currentSessionId || !session.value) return
    const docRef = doc(db, 'sessions', currentSessionId)
    try {
      await updateDoc(docRef, { [`heartbeats.${playerId}`]: Date.now() })
    } catch {}
  }

  function startTurnTimer() {
    stopTurnTimer()
    turnTimer = setInterval(() => {
      const s = session.value
      if (!s || s.status !== 'playing' || !s.turnStartedAt) {
        turnSecondsLeft.value = null
        return
      }
      // Only auto-advance for numeric timeouts; 'manual' / 'admin' are advanced via passTurn
      if (typeof s.turnTimeout !== 'number') {
        turnSecondsLeft.value = null
        return
      }
      const timeoutMs = s.turnTimeout * 1000
      const elapsed = Date.now() - s.turnStartedAt
      const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000))
      turnSecondsLeft.value = remaining

      // Host auto-advances when timer runs out
      if (remaining <= 0 && isHost.value && currentSessionId) {
        advanceTurn()
      }
    }, 1000)
  }

  function stopTurnTimer() {
    if (turnTimer) {
      clearInterval(turnTimer)
      turnTimer = null
    }
    turnSecondsLeft.value = null
  }

  async function advanceTurn() {
    if (!session.value || !currentSessionId) return
    const nextIndex = (session.value.currentPlayerIndex + 1) % session.value.players.length
    const docRef = doc(db, 'sessions', currentSessionId)
    try {
      await updateDoc(docRef, {
        currentPlayerIndex: nextIndex,
        turnStartedAt: Date.now(),
      })
    } catch {}
  }

  async function passTurn() {
    if (!canPassTurn.value) return
    await advanceTurn()
  }

  function listenToSession(sessionId: string) {
    if (unsubscribe) unsubscribe()
    loading.value = true
    error.value = null
    currentSessionId = sessionId

    const docRef = doc(db, 'sessions', sessionId)
    unsubscribe = onSnapshot(docRef, (snap) => {
      loading.value = false
      if (snap.exists()) {
        session.value = snap.data() as SessionDocument
        // Ensure heartbeats field exists
        if (!session.value.heartbeats) session.value.heartbeats = {}
        // Backfill turnTimeout for sessions created before this field existed
        if (session.value.turnTimeout === undefined) session.value.turnTimeout = 30

        // Start/stop turn timer when game is playing
        if (session.value.status === 'playing') {
          startTurnTimer()
        } else {
          stopTurnTimer()
        }
      } else {
        session.value = null
        error.value = 'Spillet finnes ikke'
      }
    }, (err) => {
      loading.value = false
      error.value = err.message
    })

    startHeartbeat()
  }

  async function createSession(hostName: string): Promise<string> {
    const sessionId = generateSessionId()
    const docRef = doc(db, 'sessions', sessionId)
    const data: SessionDocument = {
      hostId: playerId,
      status: 'lobby',
      createdAt: Date.now(),
      players: [{ id: playerId, name: hostName }],
      currentPlayerIndex: 0,
      rolls: [],
      turnStartedAt: 0,
      heartbeats: { [playerId]: Date.now() },
      turnTimeout: settings.turnTimeout,
    }
    await setDoc(docRef, data)
    saveLastSession(sessionId, hostName)
    listenToSession(sessionId)
    return sessionId
  }

  async function joinSession(sessionId: string, playerName: string) {
    listenToSession(sessionId)
    // Wait for first snapshot
    await new Promise<void>((resolve, reject) => {
      const check = setInterval(() => {
        if (!loading.value) {
          clearInterval(check)
          if (session.value) resolve()
          else reject(new Error('Spillet finnes ikke'))
        }
      }, 100)
      setTimeout(() => { clearInterval(check); reject(new Error('Tidsavbrudd')) }, 10000)
    })

    if (!session.value) throw new Error('Spillet finnes ikke')

    // Already joined? Save under the canonical name from the session doc.
    const existing = session.value.players.find(p => p.id === playerId)
    if (existing) {
      saveLastSession(sessionId, existing.name)
      return
    }

    const docRef = doc(db, 'sessions', sessionId)
    const updatedPlayers = [...session.value.players, { id: playerId, name: playerName }]
    await updateDoc(docRef, {
      players: updatedPlayers,
      [`heartbeats.${playerId}`]: Date.now(),
    })
    saveLastSession(sessionId, playerName)
  }

  async function startGame(sessionId: string) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, {
      status: 'playing',
      currentPlayerIndex: 0,
      rolls: [],
      turnStartedAt: Date.now(),
    })
  }

  async function submitRoll(sessionId: string, die1: number, die2: number) {
    if (!session.value) return
    const player = myPlayer.value
    if (!player) return

    const roll: MultiplayerRoll = {
      die1,
      die2,
      sum: die1 + die2,
      timestamp: Date.now(),
      rollNumber: session.value.rolls.length + 1,
      playerId: player.id,
      playerName: player.name,
    }
    const updatedRolls = [...session.value.rolls, roll]
    const docRef = doc(db, 'sessions', sessionId)

    // Auto-advance on roll only in timer mode. In 'manual' / 'admin' the
    // turn is held until someone presses "Gi turen videre" / "Neste spiller".
    if (typeof session.value.turnTimeout === 'number') {
      const nextIndex = (session.value.currentPlayerIndex + 1) % session.value.players.length
      await updateDoc(docRef, {
        rolls: updatedRolls,
        currentPlayerIndex: nextIndex,
        turnStartedAt: Date.now(),
      })
    } else {
      await updateDoc(docRef, { rolls: updatedRolls })
    }
  }

  async function reorderPlayers(sessionId: string, newOrder: Player[]) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { players: newOrder })
  }

  async function removePlayer(sessionId: string, removePlayerId: string) {
    if (!session.value) return
    const updatedPlayers = session.value.players.filter(p => p.id !== removePlayerId)
    if (updatedPlayers.length === 0) return

    // Adjust currentPlayerIndex if needed
    let idx = session.value.currentPlayerIndex
    const removedIdx = session.value.players.findIndex(p => p.id === removePlayerId)
    if (removedIdx < idx) {
      idx = idx - 1
    } else if (removedIdx === idx) {
      idx = idx % updatedPlayers.length
    }
    if (idx >= updatedPlayers.length) idx = 0

    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, {
      players: updatedPlayers,
      currentPlayerIndex: idx,
      turnStartedAt: Date.now(),
    })
  }

  async function resetStats(sessionId: string) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { rolls: [], currentPlayerIndex: 0, turnStartedAt: Date.now() })
  }

  async function restartGame(sessionId: string) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { status: 'lobby', rolls: [], currentPlayerIndex: 0, turnStartedAt: 0 })
  }

  function stopListening() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    stopHeartbeat()
    stopTurnTimer()
  }

  onUnmounted(stopListening)

  return {
    session,
    loading,
    error,
    isHost,
    isMyTurn,
    currentPlayer,
    myPlayer,
    hasJoined,
    awayPlayerIds,
    currentPlayerAway,
    turnSecondsLeft,
    canPassTurn,
    listenToSession,
    createSession,
    joinSession,
    startGame,
    submitRoll,
    passTurn,
    reorderPlayers,
    removePlayer,
    resetStats,
    restartGame,
    stopListening,
  }
}
