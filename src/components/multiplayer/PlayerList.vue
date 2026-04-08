<script setup lang="ts">
import type { Player } from '../../composables/useSession'

const props = defineProps<{
  players: Player[]
  currentPlayerIndex?: number
  reorderable?: boolean
  myPlayerId?: string
}>()

const emit = defineEmits<{
  reorder: [players: Player[]]
}>()

function moveUp(index: number) {
  if (index <= 0) return
  const arr = [...props.players]
  ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  emit('reorder', arr)
}

function moveDown(index: number) {
  if (index >= props.players.length - 1) return
  const arr = [...props.players]
  ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  emit('reorder', arr)
}
</script>

<template>
  <div class="player-list">
    <div
      v-for="(player, i) in players"
      :key="player.id"
      class="player-item"
      :class="{
        current: currentPlayerIndex !== undefined && currentPlayerIndex === i,
        me: player.id === myPlayerId,
      }"
    >
      <span class="player-index">{{ i + 1 }}.</span>
      <span class="player-name">
        {{ player.name }}
        <span v-if="player.id === myPlayerId" class="me-tag">(deg)</span>
      </span>
      <div v-if="reorderable" class="reorder-buttons">
        <button @click.stop="moveUp(i)" :disabled="i === 0" class="move-btn">&#9650;</button>
        <button @click.stop="moveDown(i)" :disabled="i === players.length - 1" class="move-btn">&#9660;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.player-item.current {
  border-color: #3b82f6;
  background: #eff6ff;
}

.player-item.me .player-name {
  font-weight: 700;
}

.player-index {
  color: #999;
  font-size: 13px;
  width: 20px;
}

.player-name {
  flex: 1;
  font-size: 15px;
}

.me-tag {
  color: #3b82f6;
  font-size: 12px;
  font-weight: 400;
}

.reorder-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.move-btn {
  width: 28px;
  height: 22px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  color: #666;
  padding: 0;
}

.move-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
