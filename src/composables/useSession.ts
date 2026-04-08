import { ref, computed, onUnmounted, type Ref } from 'vue'
import { doc, setDoc, updateDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase'
import { getPlayerId } from './usePlayerId'
import { generateSessionId } from '../router'

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
}

export function useSession() {
  const session: Ref<SessionDocument | null> = ref(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribe: Unsubscribe | null = null

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

  function listenToSession(sessionId: string) {
    if (unsubscribe) unsubscribe()
    loading.value = true
    error.value = null

    const docRef = doc(db, 'sessions', sessionId)
    unsubscribe = onSnapshot(docRef, (snap) => {
      loading.value = false
      if (snap.exists()) {
        session.value = snap.data() as SessionDocument
      } else {
        session.value = null
        error.value = 'Spillet finnes ikke'
      }
    }, (err) => {
      loading.value = false
      error.value = err.message
    })
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
    }
    await setDoc(docRef, data)
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

    // Already joined?
    if (session.value.players.some(p => p.id === playerId)) return

    const docRef = doc(db, 'sessions', sessionId)
    const updatedPlayers = [...session.value.players, { id: playerId, name: playerName }]
    await updateDoc(docRef, { players: updatedPlayers })
  }

  async function startGame(sessionId: string) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { status: 'playing', currentPlayerIndex: 0, rolls: [] })
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
    const nextIndex = (session.value.currentPlayerIndex + 1) % session.value.players.length
    const updatedRolls = [...session.value.rolls, roll]

    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { rolls: updatedRolls, currentPlayerIndex: nextIndex })
  }

  async function reorderPlayers(sessionId: string, newOrder: Player[]) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { players: newOrder })
  }

  async function resetStats(sessionId: string) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { rolls: [], currentPlayerIndex: 0 })
  }

  async function restartGame(sessionId: string) {
    const docRef = doc(db, 'sessions', sessionId)
    await updateDoc(docRef, { status: 'lobby', rolls: [], currentPlayerIndex: 0 })
  }

  function stopListening() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
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
    listenToSession,
    createSession,
    joinSession,
    startGame,
    submitRoll,
    reorderPlayers,
    resetStats,
    restartGame,
    stopListening,
  }
}
