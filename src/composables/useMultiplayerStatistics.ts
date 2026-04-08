import { computed, type Ref } from 'vue'
import type { StatisticsAPI, RollRecord } from './useStatistics'
import type { SessionDocument } from './useSession'

export function useMultiplayerStatistics(
  session: Ref<SessionDocument | null>,
  submitRollFn: (die1: number, die2: number) => Promise<void>,
  resetFn: () => Promise<void>,
): StatisticsAPI {
  const rolls = computed<RollRecord[]>(() => session.value?.rolls ?? [])

  const totalRolls = computed(() => rolls.value.length)

  const sumCounts = computed(() => {
    const counts: Record<number, number> = {}
    for (let i = 2; i <= 12; i++) counts[i] = 0
    for (const r of rolls.value) counts[r.sum]++
    return counts
  })

  const expectedProbabilities: Record<number, number> = {
    2: 1/36, 3: 2/36, 4: 3/36, 5: 4/36, 6: 5/36, 7: 6/36,
    8: 5/36, 9: 4/36, 10: 3/36, 11: 2/36, 12: 1/36,
  }

  function getCommentForSum(sum: number): string | null {
    const total = totalRolls.value
    if (total < 5) return null

    const count = sumCounts.value[sum]
    const expected = expectedProbabilities[sum] * total
    const ratio = count / expected

    if (ratio > 1.8) return `${sum} kommer mye oftere enn forventet!`
    if (ratio > 1.4) return `${sum} er over gjennomsnittet`
    if (ratio < 0.3 && total > 10) return `${sum} har kommet sjelden`
    if (ratio < 0.6) return `${sum} er under gjennomsnittet`
    return null
  }

  function getLastRollComment(): string | null {
    const r = rolls.value
    if (r.length === 0) return null
    const last = r[r.length - 1]
    const sum = last.sum
    const total = r.length

    let streak = 0
    for (let i = total - 1; i >= 0; i--) {
      if (r[i].sum === sum) streak++
      else break
    }
    if (streak >= 3) return `${sum} har kommet ${streak} ganger på rad!`

    if (total >= 4) {
      const recentCount = Math.min(total, 10)
      const recent = r.slice(-recentCount)
      const count = recent.filter(x => x.sum === sum).length
      if (count > recentCount / 2) {
        return `${sum} er kastet ${count} av ${recentCount} siste kast`
      }
    }

    return null
  }

  // The stats property needs to be reactive — use a proxy that reads from the computed
  const statsProxy = new Proxy({ rolls: [] as RollRecord[] }, {
    get(_target, prop) {
      if (prop === 'rolls') return rolls.value
      return undefined
    }
  })

  return {
    stats: statsProxy,
    addRoll: submitRollFn,
    reset: resetFn,
    totalRolls,
    sumCounts,
    expectedProbabilities,
    getCommentForSum,
    getLastRollComment,
  }
}
