import { reactive, computed, watch } from 'vue'

export interface Player {
  id: string
  name: string
}

// A round holds each player's banked score for that round, keyed by player id.
export type Round = Record<string, number>

export interface Flip7State {
  players: Player[]
  rounds: Round[]
  target: number
  started: boolean
}

const STORAGE_KEY = 'flip7-scoresheet'
export const DEFAULT_TARGET = 200
export const FLIP7_BONUS = 15

// Flat modifier cards. The x2 card is handled separately (it doubles the
// number-card total before the flat bonuses are added).
export const BONUS_CARDS = [2, 4, 6, 8, 10] as const
export const NUMBER_CARDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function defaultState(): Flip7State {
  return { players: [], rounds: [], target: DEFAULT_TARGET, started: false }
}

function loadState(): Flip7State {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultState(), ...parsed }
    }
  } catch {}
  return defaultState()
}

const state = reactive<Flip7State>(loadState())

watch(state, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export interface RoundBuild {
  numbers: number[]
  x2: boolean
  bonuses: number[]
  bust: boolean
}

export function scoreRound(b: RoundBuild): number {
  if (b.bust) return 0
  const unique = Array.from(new Set(b.numbers))
  const numberSum = unique.reduce((a, n) => a + n, 0)
  const bonusSum = b.bonuses.reduce((a, n) => a + n, 0)
  const flip7 = unique.length >= 7 ? FLIP7_BONUS : 0
  return numberSum * (b.x2 ? 2 : 1) + bonusSum + flip7
}

export function useFlip7() {
  const totals = computed<Record<string, number>>(() => {
    const t: Record<string, number> = {}
    for (const p of state.players) t[p.id] = 0
    for (const round of state.rounds) {
      for (const p of state.players) {
        t[p.id] += round[p.id] ?? 0
      }
    }
    return t
  })

  const leaderId = computed<string | null>(() => {
    let best: string | null = null
    let bestScore = -Infinity
    for (const p of state.players) {
      const s = totals.value[p.id] ?? 0
      if (s > bestScore) {
        bestScore = s
        best = p.id
      }
    }
    return state.players.length ? best : null
  })

  // A winner exists once someone reaches the target — but only settled at the
  // end of a round, so everyone gets the same number of turns.
  const winners = computed<Player[]>(() => {
    const reached = state.players.filter(p => (totals.value[p.id] ?? 0) >= state.target)
    if (!reached.length) return []
    const top = Math.max(...reached.map(p => totals.value[p.id] ?? 0))
    return reached.filter(p => (totals.value[p.id] ?? 0) === top)
  })

  function addPlayer(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    state.players.push({ id: newId(), name: trimmed })
  }

  function removePlayer(id: string) {
    state.players = state.players.filter(p => p.id !== id)
    for (const round of state.rounds) delete round[id]
  }

  function renamePlayer(id: string, name: string) {
    const p = state.players.find(pl => pl.id === id)
    if (p) p.name = name.trim() || p.name
  }

  function startGame() {
    if (state.players.length) state.started = true
  }

  function commitRound(scores: Record<string, number>) {
    const round: Round = {}
    for (const p of state.players) round[p.id] = scores[p.id] ?? 0
    state.rounds.push(round)
  }

  function updateRound(index: number, scores: Record<string, number>) {
    if (!state.rounds[index]) return
    const round: Round = {}
    for (const p of state.players) round[p.id] = scores[p.id] ?? 0
    state.rounds[index] = round
  }

  function removeRound(index: number) {
    state.rounds.splice(index, 1)
  }

  function newGame() {
    state.rounds = []
    state.started = false
  }

  function resetAll() {
    state.players = []
    state.rounds = []
    state.target = DEFAULT_TARGET
    state.started = false
  }

  return {
    state,
    totals,
    leaderId,
    winners,
    addPlayer,
    removePlayer,
    renamePlayer,
    startGame,
    commitRound,
    updateRound,
    removeRound,
    newGame,
    resetAll,
  }
}
