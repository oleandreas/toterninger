import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { vi } from 'vitest'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../src/firebase'
import { useSession } from '../../src/composables/useSession'
import { useSettings, type TurnTimeout } from '../../src/composables/useSettings'

// Each "device" is its own useSession instance with its own player id and snapshot listener.
type Client = ReturnType<typeof useSession> & { id: string }

const clients: Client[] = []

function device(id: string): Client {
  const c = Object.assign(useSession({ playerId: id }), { id })
  clients.push(c)
  return c
}

const until = (fn: () => void) => vi.waitFor(fn, { timeout: 8000, interval: 50 })

async function setupGame(turnTimeout: TurnTimeout, names = ['Anne', 'Bjørn', 'Cato']) {
  useSettings().settings.turnTimeout = turnTimeout
  const [hostName, ...joinerNames] = names
  const host = device(`host-${crypto.randomUUID()}`)
  const sessionId = await host.createSession(hostName)
  const joiners: Client[] = []
  for (const name of joinerNames) {
    const j = device(`${name}-${crypto.randomUUID()}`)
    await j.joinSession(sessionId, name)
    joiners.push(j)
  }
  const all = [host, ...joiners]
  await until(() => all.forEach(c => expect(c.session.value?.players).toHaveLength(names.length)))
  return { sessionId, host, joiners, all }
}

async function startAndSync({ sessionId, host, all }: Awaited<ReturnType<typeof setupGame>>) {
  await host.startGame(sessionId)
  await until(() => all.forEach(c => expect(c.session.value?.status).toBe('playing')))
}

beforeAll(async () => {
  const res = await fetch('http://127.0.0.1:8080/').catch(() => null)
  if (!res) throw new Error('Firestore-emulatoren kjører ikke. Bruk `npm run test:emulator`.')
})

afterEach(() => {
  clients.splice(0).forEach(c => c.stopListening())
})

describe('session lifecycle', () => {
  it('host creates, others join and everyone sees the same lobby', async () => {
    const { host, joiners, all } = await setupGame(30)
    for (const c of all) {
      expect(c.session.value?.status).toBe('lobby')
      expect(c.session.value?.players.map(p => p.name)).toEqual(['Anne', 'Bjørn', 'Cato'])
      expect(c.hasJoined.value).toBe(true)
    }
    expect(host.isHost.value).toBe(true)
    expect(joiners.every(j => !j.isHost.value)).toBe(true)
  })

  it('joining twice from the same device does not duplicate the player', async () => {
    const { sessionId, joiners, all } = await setupGame(30)
    const again = device(joiners[0].id)
    await again.joinSession(sessionId, 'Annet navn')
    await new Promise(r => setTimeout(r, 300))
    expect(all[0].session.value?.players).toHaveLength(3)
  })

  it('joining a session that does not exist fails', async () => {
    const c = device('lonely')
    await expect(c.joinSession('000-000-000', 'Ola')).rejects.toThrow('Spillet finnes ikke')
  })

  it('snapshots the host turnTimeout onto the session', async () => {
    const { all } = await setupGame('admin')
    useSettings().settings.turnTimeout = 30
    all.forEach(c => expect(c.session.value?.turnTimeout).toBe('admin'))
  })

  it('heartbeats mark everyone as present', async () => {
    const { all } = await setupGame(30)
    await until(() => all.forEach(c => expect(c.awayPlayerIds.value.size).toBe(0)))
  })
})

describe('timer mode', () => {
  it('a roll is mirrored to every device and passes the turn', async () => {
    const game = await setupGame(30)
    await startAndSync(game)
    const { sessionId, host, joiners, all } = game

    expect(host.isMyTurn.value).toBe(true)
    expect(joiners.some(j => j.isMyTurn.value)).toBe(false)

    await host.submitRoll(sessionId, 3, 4)
    await until(() => all.forEach(c => {
      expect(c.session.value?.rolls).toHaveLength(1)
      expect(c.currentPlayer.value?.name).toBe('Bjørn')
    }))
    const r = joiners[1].session.value!.rolls[0]
    expect(r).toMatchObject({ die1: 3, die2: 4, sum: 7, rollNumber: 1, playerName: 'Anne' })
    expect(joiners[0].isMyTurn.value).toBe(true)
    expect(host.canPassTurn.value).toBe(false)
  })

  it('the turn wraps around after the last player', async () => {
    const game = await setupGame(30, ['A', 'B'])
    await startAndSync(game)
    const { sessionId, host, joiners, all } = game
    await host.submitRoll(sessionId, 1, 1)
    await until(() => expect(joiners[0].isMyTurn.value).toBe(true))
    await joiners[0].submitRoll(sessionId, 6, 6)
    await until(() => all.forEach(c => expect(c.session.value?.rolls).toHaveLength(2)))
    expect(host.isMyTurn.value).toBe(true)
  })
})

describe('manual mode', () => {
  it('holds the turn after a roll until the active player passes it', async () => {
    const game = await setupGame('manual')
    await startAndSync(game)
    const { sessionId, host, joiners, all } = game

    await host.submitRoll(sessionId, 2, 5)
    await until(() => all.forEach(c => expect(c.session.value?.rolls).toHaveLength(1)))
    expect(host.isMyTurn.value).toBe(true)

    expect(host.canPassTurn.value).toBe(true)
    expect(joiners[0].canPassTurn.value).toBe(false)

    await joiners[0].passTurn()
    await new Promise(r => setTimeout(r, 300))
    expect(host.isMyTurn.value).toBe(true)

    await host.passTurn()
    await until(() => all.forEach(c => expect(c.currentPlayer.value?.name).toBe('Bjørn')))
    expect(joiners[0].canPassTurn.value).toBe(true)
    expect(host.canPassTurn.value).toBe(false)
  })
})

describe('admin mode', () => {
  it('only the host can advance the turn', async () => {
    const game = await setupGame('admin')
    await startAndSync(game)
    const { sessionId, host, joiners, all } = game

    await host.passTurn()
    await until(() => all.forEach(c => expect(c.currentPlayer.value?.name).toBe('Bjørn')))

    expect(joiners[0].isMyTurn.value).toBe(true)
    expect(joiners[0].canPassTurn.value).toBe(false)
    expect(host.canPassTurn.value).toBe(true)

    await joiners[0].submitRoll(sessionId, 4, 4)
    await until(() => all.forEach(c => expect(c.session.value?.rolls).toHaveLength(1)))
    expect(joiners[0].isMyTurn.value).toBe(true)
  })
})

describe('host controls', () => {
  it('removing the active player keeps the turn pointer valid', async () => {
    const game = await setupGame('manual')
    await startAndSync(game)
    const { sessionId, host, joiners, all } = game

    await host.passTurn()
    await until(() => expect(host.currentPlayer.value?.name).toBe('Bjørn'))

    await host.removePlayer(sessionId, joiners[0].id)
    await until(() => all.forEach(c => expect(c.session.value?.players).toHaveLength(2)))
    expect(host.currentPlayer.value?.name).toBe('Cato')
    expect(joiners[0].hasJoined.value).toBe(false)
  })

  it('reset clears rolls and restart returns everyone to the lobby', async () => {
    const game = await setupGame(30, ['A', 'B'])
    await startAndSync(game)
    const { sessionId, host, all } = game

    await host.submitRoll(sessionId, 5, 5)
    await until(() => all.forEach(c => expect(c.session.value?.rolls).toHaveLength(1)))

    await host.resetStats(sessionId)
    await until(() => all.forEach(c => {
      expect(c.session.value?.rolls).toHaveLength(0)
      expect(c.session.value?.currentPlayerIndex).toBe(0)
    }))

    await host.restartGame(sessionId)
    await until(() => all.forEach(c => expect(c.session.value?.status).toBe('lobby')))
  })
})

describe('firestore.rules', () => {
  const base = () => ({
    hostId: 'h', status: 'lobby', createdAt: Date.now(),
    players: [{ id: 'h', name: 'H' }], currentPlayerIndex: 0, rolls: [],
    turnStartedAt: 0, heartbeats: {}, turnTimeout: 30,
  })

  it('accepts a well-formed session', async () => {
    await expect(setDoc(doc(db, 'sessions', `rules-${crypto.randomUUID()}`), base())).resolves.toBeUndefined()
  })

  it('rejects unknown fields on create', async () => {
    const ref = doc(db, 'sessions', `rules-${crypto.randomUUID()}`)
    await expect(setDoc(ref, { ...base(), sneaky: true })).rejects.toThrow(/permission/i)
  })

  it('rejects changing hostId', async () => {
    const ref = doc(db, 'sessions', `rules-${crypto.randomUUID()}`)
    await setDoc(ref, base())
    await expect(updateDoc(ref, { hostId: 'thief' })).rejects.toThrow(/permission/i)
  })

  it('denies writes outside sessions', async () => {
    await expect(setDoc(doc(db, 'other', 'x'), { a: 1 })).rejects.toThrow(/permission/i)
  })
})
