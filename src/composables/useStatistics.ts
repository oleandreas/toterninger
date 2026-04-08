import { reactive, computed, watch } from 'vue'

export interface RollRecord {
  die1: number
  die2: number
  sum: number
  timestamp: number
  rollNumber: number
}

export interface Statistics {
  rolls: RollRecord[]
}

const STORAGE_KEY = 'toterninger-stats'

function loadStats(): Statistics {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { rolls: [] }
}

const stats = reactive<Statistics>(loadStats())

watch(stats, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useStatistics() {
  function addRoll(die1: number, die2: number) {
    stats.rolls.push({
      die1,
      die2,
      sum: die1 + die2,
      timestamp: Date.now(),
      rollNumber: stats.rolls.length + 1,
    })
  }

  function reset() {
    stats.rolls.splice(0, stats.rolls.length)
  }

  const totalRolls = computed(() => stats.rolls.length)

  const sumCounts = computed(() => {
    const counts: Record<number, number> = {}
    for (let i = 2; i <= 12; i++) counts[i] = 0
    for (const r of stats.rolls) counts[r.sum]++
    return counts
  })

  const expectedProbabilities: Record<number, number> = {
    2: 1/36, 3: 2/36, 4: 3/36, 5: 4/36, 6: 5/36, 7: 6/36,
    8: 5/36, 9: 4/36, 10: 3/36, 11: 2/36, 12: 1/36,
  }

  function getCommentForSum(sum: number): string | null {
    const total = stats.rolls.length
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
    if (stats.rolls.length === 0) return null
    const last = stats.rolls[stats.rolls.length - 1]
    const sum = last.sum

    // Check early game patterns
    if (stats.rolls.length <= 10 && stats.rolls.length >= 3) {
      const recentSums = stats.rolls.slice(-3).map(r => r.sum)
      if (recentSums.every(s => s === sum)) {
        return `${sum} tre ganger på rad!`
      }
    }

    // Check streaks
    let streak = 0
    for (let i = stats.rolls.length - 1; i >= 0; i--) {
      if (stats.rolls[i].sum === sum) streak++
      else break
    }
    if (streak >= 3) return `${sum} har kommet ${streak} ganger på rad!`

    // Check frequency context
    if (stats.rolls.length >= 5) {
      const firstHalfLen = Math.floor(stats.rolls.length / 2)
      const firstHalfCount = stats.rolls.slice(0, firstHalfLen).filter(r => r.sum === sum).length
      const secondHalfCount = stats.rolls.slice(firstHalfLen).filter(r => r.sum === sum).length
      const firstRate = firstHalfCount / firstHalfLen
      const secondRate = secondHalfCount / (stats.rolls.length - firstHalfLen)

      if (firstRate > secondRate * 2 && firstHalfCount >= 2) {
        return `${sum} var mye vanligere i starten av spillet`
      }
      if (secondRate > firstRate * 2 && secondHalfCount >= 2) {
        return `${sum} har blitt vanligere utover i spillet`
      }
    }

    return getCommentForSum(sum)
  }

  return {
    stats,
    addRoll,
    reset,
    totalRolls,
    sumCounts,
    expectedProbabilities,
    getCommentForSum,
    getLastRollComment,
  }
}
