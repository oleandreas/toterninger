<script setup lang="ts">
import { computed } from 'vue'
import type { SessionDocument, Player } from '../../composables/useSession'
import PlayerList from './PlayerList.vue'
import QRCode from './QRCode.vue'
import { getPlayerId } from '../../composables/usePlayerId'

const props = defineProps<{
  session: SessionDocument
  sessionId: string
}>()

const emit = defineEmits<{
  start: []
  reorder: [players: Player[]]
}>()

const playerId = getPlayerId()
const isHost = computed(() => props.session.hostId === playerId)
const sessionUrl = computed(() => `${window.location.origin}/#/session/${props.sessionId}`)

function copyUrl() {
  navigator.clipboard.writeText(sessionUrl.value)
}

function handleReorder(players: Player[]) {
  emit('reorder', players)
}
</script>

<template>
  <div class="lobby">
    <h2>Venterom</h2>

    <div v-if="isHost" class="share-section">
      <p class="share-text">Del denne lenken med de andre spillerne:</p>

      <div class="url-box" @click="copyUrl">
        <span class="url-text">{{ sessionUrl }}</span>
        <span class="copy-hint">Kopier</span>
      </div>

      <QRCode :url="sessionUrl" />
    </div>

    <div v-else class="waiting-section">
      <p>Venter på at verten starter spillet...</p>
    </div>

    <h3>Spillere ({{ session.players.length }})</h3>
    <PlayerList
      :players="session.players"
      :reorderable="isHost"
      :my-player-id="playerId"
      @reorder="handleReorder"
    />

    <button
      v-if="isHost"
      class="start-btn"
      :disabled="session.players.length < 2"
      @click="emit('start')"
    >
      Start spill
    </button>
    <p v-if="isHost && session.players.length < 2" class="hint">
      Minst 2 spillere for å starte
    </p>
  </div>
</template>

<style scoped>
.lobby {
  padding: 16px;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

h2 {
  font-size: 22px;
  margin: 0 0 16px;
}

h3 {
  font-size: 16px;
  margin: 20px 0 8px;
  text-align: left;
}

.share-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.share-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.url-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.url-box:hover {
  background: var(--bg-hover);
}

.url-text {
  flex: 1;
  font-size: 13px;
  word-break: break-all;
  text-align: left;
  color: var(--text);
}

.copy-hint {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
}

.waiting-section p {
  color: var(--text-muted);
  font-size: 15px;
}

.start-btn {
  margin-top: 20px;
  width: 100%;
  padding: 14px;
  background: var(--success);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.start-btn:hover:not(:disabled) {
  background: var(--success-hover);
}

.start-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 8px 0 0;
}
</style>
