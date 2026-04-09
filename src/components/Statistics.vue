<script setup lang="ts">
import { computed, inject } from 'vue'
import { useStatistics, statisticsKey } from '../composables/useStatistics'

const props = withDefaults(defineProps<{
  canReset?: boolean
}>(), { canReset: true })

const statsApi = inject(statisticsKey, undefined) ?? useStatistics()
const { stats, totalRolls, sumCounts, expectedProbabilities, reset, getCommentForSum } = statsApi

const maxCount = computed(() => Math.max(...Object.values(sumCounts.value), 1))

function percentage(sum: number): string {
  if (totalRolls.value === 0) return '0'
  return ((sumCounts.value[sum] / totalRolls.value) * 100).toFixed(1)
}

function expectedPercentage(sum: number): string {
  return (expectedProbabilities[sum] * 100).toFixed(1)
}

const lastTenRolls = computed(() => {
  return [...stats.rolls].reverse().slice(0, 10)
})

function handleReset() {
  if (confirm('Nullstille all statistikk?')) {
    reset()
  }
}
</script>

<template>
  <div class="statistics">
    <div class="stats-header">
      <h2>Statistikk</h2>
      <span class="total">{{ totalRolls }} kast</span>
    </div>

    <div v-if="totalRolls > 0" class="distribution">
      <div v-for="sum in [2,3,4,5,6,7,8,9,10,11,12]" :key="sum" class="bar-row">
        <span class="bar-label" :class="{ seven: sum === 7 }">{{ sum }}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            :class="{ seven: sum === 7 }"
            :style="{ width: maxCount > 0 ? (sumCounts[sum] / maxCount * 100) + '%' : '0%' }"
          />
        </div>
        <span class="bar-count">{{ sumCounts[sum] }}</span>
        <span class="bar-pct">{{ percentage(sum) }}%</span>
        <span class="bar-expected" :title="'Forventet: ' + expectedPercentage(sum) + '%'">
          ({{ expectedPercentage(sum) }}%)
        </span>
      </div>
    </div>

    <div v-if="totalRolls > 0" class="comments">
      <template v-for="sum in [2,3,4,5,6,7,8,9,10,11,12]" :key="sum">
        <div v-if="getCommentForSum(sum)" class="comment-item">
          {{ getCommentForSum(sum) }}
        </div>
      </template>
    </div>

    <div v-if="lastTenRolls.length > 0" class="history">
      <h3>Siste kast</h3>
      <div class="history-list">
        <div v-for="roll in lastTenRolls" :key="roll.rollNumber" class="history-item">
          <span class="history-num">#{{ roll.rollNumber }}</span>
          <span class="history-dice">{{ roll.die1 }} + {{ roll.die2 }}</span>
          <span class="history-sum" :class="{ seven: roll.sum === 7 }">= {{ roll.sum }}</span>
          <span v-if="roll.playerName" class="history-player">{{ roll.playerName }}</span>
        </div>
      </div>
    </div>

    <button v-if="totalRolls > 0 && canReset" class="reset-btn" @click="handleReset">
      Nullstill statistikk
    </button>
  </div>
</template>

<style scoped>
.statistics {
  padding: 16px;
  max-width: 500px;
  margin: 0 auto;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stats-header h2 {
  margin: 0;
  font-size: 20px;
}

.total {
  font-size: 14px;
  color: var(--text-muted);
}

.distribution {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.bar-label {
  width: 24px;
  text-align: right;
  font-weight: 700;
  font-size: 14px;
}

.bar-label.seven {
  color: var(--danger);
}

.bar-track {
  flex: 1;
  height: 18px;
  background: var(--bar-track);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--bar-fill);
  border-radius: 4px;
  transition: width 0.3s ease;
  min-width: 0;
}

.bar-fill.seven {
  background: var(--danger);
}

.bar-count {
  width: 28px;
  text-align: right;
  font-weight: 600;
}

.bar-pct {
  width: 44px;
  text-align: right;
  color: var(--text-secondary);
}

.bar-expected {
  width: 52px;
  text-align: right;
  color: var(--text-faint);
  font-size: 11px;
}

.comments {
  margin-bottom: 16px;
}

.comment-item {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 4px;
}

.history {
  margin-bottom: 16px;
}

.history h3 {
  font-size: 16px;
  margin: 0 0 8px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  gap: 12px;
  font-size: 13px;
  padding: 4px 8px;
  background: var(--bg-subtle);
  border-radius: 4px;
}

.history-num {
  color: var(--text-faint);
  width: 36px;
}

.history-dice {
  color: var(--text-secondary);
}

.history-sum {
  font-weight: 700;
}

.history-sum.seven {
  color: var(--danger);
}

.history-player {
  color: var(--text-muted);
  font-size: 12px;
  margin-left: auto;
}

.reset-btn {
  width: 100%;
  padding: 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.2s;
}

.reset-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}
</style>
