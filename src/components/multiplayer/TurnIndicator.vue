<script setup lang="ts">
defineProps<{
  playerName: string
  isMyTurn: boolean
  secondsLeft: number | null
  playerAway: boolean
}>()
</script>

<template>
  <div class="turn-indicator" :class="{ 'my-turn': isMyTurn, 'away': playerAway }">
    <div class="turn-text">
      <template v-if="isMyTurn">Din tur!</template>
      <template v-else>{{ playerName }} kaster...</template>
    </div>
    <div v-if="playerAway && !isMyTurn" class="away-badge">Borte</div>
    <div v-if="secondsLeft !== null" class="timer" :class="{ urgent: secondsLeft <= 5 }">
      {{ secondsLeft }}s
    </div>
  </div>
</template>

<style scoped>
.turn-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 10px 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border-radius: 10px;
  margin: 0 16px;
  transition: all 0.3s;
}

.turn-indicator.my-turn {
  color: #fff;
  background: var(--accent);
  animation: pulse-turn 1.5s ease-in-out infinite alternate;
}

.turn-indicator.away:not(.my-turn) {
  background: var(--warning-bg);
  color: var(--warning);
}

@keyframes pulse-turn {
  from { box-shadow: 0 0 0 0 rgba(99, 144, 240, 0.4); }
  to { box-shadow: 0 0 12px 4px rgba(99, 144, 240, 0.25); }
}

.turn-text {
  flex: 1;
}

.away-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--warning);
  color: #1a1a1a;
  font-weight: 700;
  text-transform: uppercase;
}

.timer {
  font-size: 14px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0,0,0,0.1);
  min-width: 36px;
  text-align: center;
}

.my-turn .timer {
  background: rgba(255,255,255,0.2);
}

.timer.urgent {
  color: var(--danger);
  background: var(--danger-bg);
}

.my-turn .timer.urgent {
  color: #fff;
  background: var(--danger);
}
</style>
