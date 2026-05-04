<script setup lang="ts">
import { ref, provide, computed, watch } from 'vue'
import { useSession } from '../../composables/useSession'
import { useMultiplayerStatistics } from '../../composables/useMultiplayerStatistics'
import { statisticsKey } from '../../composables/useStatistics'
import { useRouter } from '../../router'
import { getPlayerId } from '../../composables/usePlayerId'
import MultiplayerHome from './MultiplayerHome.vue'
import Lobby from './Lobby.vue'
import TurnIndicator from './TurnIndicator.vue'
import PlayerList from './PlayerList.vue'
import DiceRoller from '../DiceRoller.vue'
import Statistics from '../Statistics.vue'

const props = defineProps<{ sessionId: string }>()

const isNewSession = props.sessionId === '__new__'
const actualSessionId = ref(isNewSession ? '' : props.sessionId)
const myPlayerId = getPlayerId()

const {
  session, loading, error, isHost, isMyTurn, currentPlayer, hasJoined,
  awayPlayerIds, currentPlayerAway, turnSecondsLeft, canPassTurn,
  listenToSession, startGame, submitRoll, passTurn,
  reorderPlayers, removePlayer, resetStats, restartGame,
} = useSession()

const { navigate } = useRouter()

if (!isNewSession) {
  listenToSession(props.sessionId)
}

const statsApi = useMultiplayerStatistics(
  session,
  (d1, d2) => submitRoll(actualSessionId.value, d1, d2),
  () => resetStats(actualSessionId.value),
)
provide(statisticsKey, statsApi)

type Tab = 'dice' | 'stats' | 'players'
const activeTab = ref<Tab>('dice')

watch(isMyTurn, (mine) => {
  if (mine) activeTab.value = 'dice'
})

const showHostMenu = ref(false)
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

async function handleRemovePlayer(pid: string) {
  const player = session.value?.players.find(p => p.id === pid)
  const name = player?.name ?? 'Spiller'
  if (confirm(`Fjerne ${name} fra spillet?`)) {
    await removePlayer(actualSessionId.value, pid)
  }
}

function handleLeave() {
  navigate({ name: 'home' })
}

const disabled = computed(() => !isMyTurn.value)

// Count away players for badge
const awayCount = computed(() => {
  if (!session.value) return 0
  return session.value.players.filter(p => awayPlayerIds.value.has(p.id)).length
})
</script>

<template>
  <div class="mp-game">
    <!-- CREATE FLOW -->
    <template v-if="needsNameInput">
      <MultiplayerHome
        :join-session-id="isNewSession ? undefined : actualSessionId"
        @joined="handleJoined"
        @created="handleCreated"
      />
    </template>

    <!-- Loading -->
    <div v-else-if="loading" class="center-msg">Laster...</div>

    <!-- Error -->
    <div v-else-if="error" class="center-msg">
      <p>{{ error }}</p>
      <button class="link-btn" @click="handleLeave">Tilbake</button>
    </div>

    <!-- Need to join -->
    <template v-else-if="session && !hasJoined">
      <MultiplayerHome :join-session-id="actualSessionId" @joined="handleJoined" />
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

      <div v-if="showHostMenu && isHost" class="host-menu">
        <button @click="handleResetStats">Nullstill statistikk</button>
        <button @click="handleRestart">Start på nytt</button>
      </div>

      <TurnIndicator
        v-if="currentPlayer"
        :player-name="currentPlayer.name"
        :is-my-turn="isMyTurn"
        :seconds-left="turnSecondsLeft"
        :player-away="currentPlayerAway"
      />

      <div v-if="canPassTurn" class="pass-turn">
        <button class="pass-btn" @click="passTurn">
          {{ session.turnTimeout === 'admin' && !isMyTurn ? `Neste spiller` : 'Gi turen videre' }}
        </button>
      </div>

      <main class="game-main" :class="{ 'game-main-top': activeTab !== 'dice' }">
        <DiceRoller v-if="activeTab === 'dice'" :disabled="disabled" />
        <Statistics v-else-if="activeTab === 'stats'" :can-reset="isHost" />
        <div v-else-if="activeTab === 'players'" class="players-tab">
          <h3>Spillere</h3>
          <PlayerList
            :players="session.players"
            :current-player-index="session.currentPlayerIndex"
            :my-player-id="myPlayerId"
            :away-player-ids="awayPlayerIds"
            :can-remove="isHost"
            @remove="handleRemovePlayer"
          />
        </div>
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
        <button :class="{ active: activeTab === 'players' }" @click="activeTab = 'players'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="7" r="4" />
            <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
            <circle cx="19" cy="7" r="3" />
            <path d="M22 21v-1.5a3 3 0 0 0-3-3" />
          </svg>
          <span>Spillere{{ awayCount > 0 ? ` (${awayCount})` : '' }}</span>
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
  color: var(--text);
}

.back-btn, .menu-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 8px;
}

.back-btn:hover, .menu-btn:hover {
  background: var(--bg-subtle);
}

.spacer { width: 36px; }

.host-menu {
  display: flex;
  gap: 8px;
  padding: 0 16px 8px;
  justify-content: center;
}

.host-menu button {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-subtle);
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
}

.host-menu button:hover { background: var(--bg-hover); }

.pass-turn {
  display: flex;
  justify-content: center;
  padding: 8px 16px 0;
}

.pass-btn {
  padding: 8px 18px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pass-btn:hover { opacity: 0.85; }

.game-main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.game-main-top {
  justify-content: flex-start;
}

.players-tab {
  padding: 16px;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.players-tab h3 {
  font-size: 18px;
  margin: 0 0 12px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 15px;
  cursor: pointer;
  text-decoration: underline;
}

.tab-bar {
  display: flex;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
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
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-bar button.active { color: var(--accent); }
.tab-bar svg { width: 22px; height: 22px; }
</style>
