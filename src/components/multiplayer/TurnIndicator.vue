<script setup lang="ts">
defineProps<{
  playerName: string
  isMyTurn: boolean
}>()
</script>

<template>
  <div class="turn-indicator" :class="{ 'my-turn': isMyTurn }">
    <template v-if="isMyTurn">
      Din tur!
    </template>
    <template v-else>
      {{ playerName }} kaster...
    </template>
  </div>
</template>

<style scoped>
.turn-indicator {
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

@keyframes pulse-turn {
  from { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  to { box-shadow: 0 0 12px 4px rgba(59, 130, 246, 0.2); }
}
</style>
