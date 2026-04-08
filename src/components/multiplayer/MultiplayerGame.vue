<script setup lang="ts">
import { ref, provide, computed, watch } from 'vue'
import { useSession } from '../../composables/useSession'
import { useMultiplayerStatistics } from '../../composables/useMultiplayerStatistics'
import { statisticsKey } from '../../composables/useStatistics'
import { useRouter } from '../../router'
import MultiplayerHome from './MultiplayerHome.vue'
import Lobby from './Lobby.vue'
import TurnIndicator from './TurnIndicator.vue'
import DiceRoller from '../DiceRoller.vue'
import Statistics from '../Statistics.vue'

const props = defineProps<{ sessionId: string }>()

const isNewSession = props.sessionId === '__new__'
const actualSessionId = ref(isNewSession ? '' : props.sessionId)

const {
  session, loading, error, isHost, isMyTurn, currentPlayer, hasJoined,
  listenToSession, startGame, submitRoll,
  reorderPlayers, resetStats, restartGame,
} = useSession()

const { navigate } = useRouter()

// Start listening if we have a real session ID
if (!isNewSession) {
  listenToSession(props.sessionId)
}

// Multiplayer statistics adapter
const statsApi = useMultiplayerStatistics(
  session,
  (d1, d2) => submitRoll(actualSessionId.value, d1, d2),
  () => resetStats(actualSessionId.value),
)
provide(statisticsKey, statsApi)

type Tab = 'dice' | 'stats'
const activeTab = ref<Tab>('dice')

// Switch to dice tab when it becomes your turn
watch(isMyTurn, (mine) => {
  if (mine) activeTab.value = 'dice'
})

const showHostMenu = ref(false)

// Track if we need name input
const needsNameInput = ref(isNewSession)

async function handleCreated(sessionId: string) {
  actualSessionId.value = sessionId
  needsNameInput.value = false
  navigate({ name: 'session', sessionId })
}

function handleJoined() {
  needsNameInput.value = false
}

async function handleStart() {
  await startGame(actualSessionId.value)
}

async function handleReorder(players: any[]) {
  await reorderPlayers(actualSessionId.value, players)
}

async function handleRestart() {
  showHostMenu.value = false
  await restartGame(actualSessionId.value)
}

async function handleResetStats() {
  if (confirm('Nullstille all statistikk?')) {
    showHostMenu.value = false
    await resetStats(actualSessionId.value)
  }
}

function handleLeave() {
  navigate({ name: 'home' })
}

const disabled = computed(() => !isMyTurn.value)
</script>

<template>
  <div class="mp-game">
    <!-- CREATE FLOW: need name input -->
    <template v-if="needsNameInput">
      <MultiplayerHome
        :join-session-id="isNewSession ? undefined : actualSessionId"
        @joined="handleJoined"
        @created="handleCreated"
      />
    </template>

    <!-- Loading -->
    <div v-else-if="loading" class="center-msg">
      Laster...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="center-msg">
      <p>{{ error }}</p>
      <button class="link-btn" @click="handleLeave">Tilbake</button>
    </div>

    <!-- Need to join (arriving via URL but not in player list) -->
    <template v-else-if="session && !hasJoined">
      <MultiplayerHome
        :join-session-id="actualSessionId"
        @joined="handleJoined"
      />
    </template>

    <!-- Lobby -->
    <template v-else-if="session && session.status === 'lobby'">
      <Lobby
        :session="session"
        :session-id="actualSessionId"
        @start="handleStart"
        @reorder="handleReorder"
      />
    </template>

    <!-- Playing -->
    <template v-else-if="session && session.status === 'playing'">
      <header class="game-header">
        <button class="back-btn" @click="handleLeave">&#8592;</button>
        <h1>Toterninger</h1>
        <button v-if="isHost" class="menu-btn" @click="showHostMenu = !showHostMenu">&#8942;</button>
        <span v-else class="spacer" />
      </header>

      <!-- Host menu -->
      <div v-if="showHostMenu && isHost" class="host-menu">
        <button @click="handleResetStats">Nullstill statistikk</button>
        <button @click="handleRestart">Start på nytt</button>
      </div>

      <TurnIndicator
        v-if="currentPlayer"
        :player-name="currentPlayer.name"
        :is-my-turn="isMyTurn"
      />

      <main class="game-main">
        <DiceRoller v-if="activeTab === 'dice'" :disabled="disabled" />
        <Statistics v-else-if="activeTab === 'stats'" :can-reset="isHost" />
      </main>

      <nav class="tab-bar">
        <button :class="{ active: activeTab === 'dice' }" @click="activeTab = 'dice'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          <span>Kast</span>
        </button>
        <button :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="14" width="4" height="7" rx="1" />
            <rect x="10" y="8" width="4" height="13" rx="1" />
            <rect x="16" y="4" width="4" height="17" rx="1" />
          </svg>
          <span>Statistikk</span>
        </button>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.mp-game {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 600px;
  margin: 0 auto;
}

.center-msg {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 16px;
  gap: 12px;
}

.game-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
}

.game-header h1 {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  text-align: center;
  color: #222;
}

.back-btn, .menu-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  border-radius: 8px;
}

.back-btn:hover, .menu-btn:hover {
  background: #f0f0f0;
}

.spacer {
  width: 36px;
}

.host-menu {
  display: flex;
  gap: 8px;
  padding: 0 16px 8px;
  justify-content: center;
}

.host-menu button {
  padding: 6px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9f9f9;
  font-size: 13px;
  cursor: pointer;
  color: #666;
}

.host-menu button:hover {
  background: #eee;
}

.game-main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.link-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 15px;
  cursor: pointer;
  text-decoration: underline;
}

.tab-bar {
  display: flex;
  border-top: 1px solid #e5e5e5;
  background: #fff;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.tab-bar button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border: none;
  background: none;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-bar button.active {
  color: #3b82f6;
}

.tab-bar svg {
  width: 22px;
  height: 22px;
}
</style>
