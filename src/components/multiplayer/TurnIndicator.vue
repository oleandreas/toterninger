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
  color: #666;
  background: #f5f5f5;
  border-radius: 10px;
  margin: 0 16px;
  transition: all 0.3s;
}

.turn-indicator.my-turn {
  color: #fff;
  background: #3b82f6;
  animation: pulse-turn 1.5s ease-in-out infinite alternate;
}

.turn-indicator.away:not(.my-turn) {
  background: #fef3c7;
  color: #92400e;
}

@keyframes pulse-turn {
  from { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  to { box-shadow: 0 0 12px 4px rgba(59, 130, 246, 0.2); }
}

.turn-text {
  flex: 1;
}

.away-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f59e0b;
  color: #fff;
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
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}

.my-turn .timer.urgent {
  color: #fef2f2;
  background: rgba(220, 38, 38, 0.4);
}
</style>
