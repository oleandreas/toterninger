import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useMultiplayerStatistics } from '../../src/composables/useMultiplayerStatistics'
import type { SessionDocument, MultiplayerRoll } from '../../src/composables/useSession'

function roll(sum: number, n: number): MultiplayerRoll {
  const die1 = Math.min(6, sum - 1)
  return { die1, die2: sum - die1, sum, timestamp: n, rollNumber: n, playerId: 'p', playerName: 'P' }
}

function sessionWith(sums: number[]): SessionDocument {
  return {
    hostId: 'p', status: 'playing', createdAt: 0, players: [{ id: 'p', name: 'P' }],
    currentPlayerIndex: 0, rolls: sums.map((s, i) => roll(s, i + 1)),
    turnStartedAt: 0, heartbeats: {}, turnTimeout: 'manual',
  }
}

describe('useMultiplayerStatistics', () => {
  it('derives counts from the session document and tracks updates', () => {
    const session = ref<SessionDocument | null>(sessionWith([7, 7, 8]))
    const api = useMultiplayerStatistics(session, vi.fn(), vi.fn())
    expect(api.totalRolls.value).toBe(3)
    expect(api.sumCounts.value[7]).toBe(2)
    expect(api.sumCounts.value[8]).toBe(1)

    session.value = sessionWith([2, 3, 4, 5])
    expect(api.totalRolls.value).toBe(4)
    expect(api.stats.rolls.map(r => r.sum)).toEqual([2, 3, 4, 5])
  })

  it('is empty when there is no session', () => {
    const api = useMultiplayerStatistics(ref(null), vi.fn(), vi.fn())
    expect(api.totalRolls.value).toBe(0)
    expect(api.stats.rolls).toEqual([])
    expect(api.getLastRollComment()).toBeNull()
  })

  it('comments on streaks', () => {
    const api = useMultiplayerStatistics(ref(sessionWith([4, 9, 9, 9])), vi.fn(), vi.fn())
    expect(api.getLastRollComment()).toBe('9 har kommet 3 ganger på rad!')
  })

  it('forwards addRoll and reset to the session backend', async () => {
    const submit = vi.fn().mockResolvedValue(undefined)
    const reset = vi.fn().mockResolvedValue(undefined)
    const api = useMultiplayerStatistics(ref(null), submit, reset)
    await api.addRoll(3, 4)
    await api.reset()
    expect(submit).toHaveBeenCalledWith(3, 4)
    expect(reset).toHaveBeenCalled()
  })
})
