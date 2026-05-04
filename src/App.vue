<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from './router'
import { db } from './firebase'
import { getLastSession, clearLastSession, type LastSession } from './lastSession'
import { getPlayerId } from './composables/usePlayerId'
import type { SessionDocument } from './composables/useSession'
import DiceRoller from './components/DiceRoller.vue'
import Statistics from './components/Statistics.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import AboutPage from './components/AboutPage.vue'
import MultiplayerGame from './components/multiplayer/MultiplayerGame.vue'

const { route, navigate } = useRouter()

type Tab = 'dice' | 'stats' | 'settings' | 'about'
const activeTab = ref<Tab>('dice')

function openMultiplayer() {
  // Navigate to a temp state — MultiplayerHome will create the session
  // We use a special hash to show the create flow
  window.location.hash = '/session/new'
}

const showCreateFlow = ref(false)

// Watch for #/session/new (create flow)
function checkNewFlow() {
  showCreateFlow.value = window.location.hash === '#/session/new'
}
checkNewFlow()
window.addEventListener('hashchange', checkNewFlow)

// --- Reconnect prompt ---
const reconnectPrompt = ref<LastSession | null>(null)

async function checkLastSession() {
  const last = getLastSession()
  if (!last) return
  try {
    const snap = await getDoc(doc(db, 'sessions', last.sessionId))
    if (!snap.exists()) {
      clearLastSession()
      return
    }
    const session = snap.data() as SessionDocument
    if (session.status !== 'lobby' && session.status !== 'playing') {
      clearLastSession()
      return
    }
    if (!session.players.some(p => p.id === getPlayerId())) {
      clearLastSession()
      return
    }
    reconnectPrompt.value = last
  } catch {
    // Network/permission error — leave the saved session, try again next visit
  }
}

function acceptReconnect() {
  if (!reconnectPrompt.value) return
  navigate({ name: 'session', sessionId: reconnectPrompt.value.sessionId })
  reconnectPrompt.value = null
}

function dismissReconnect() {
  clearLastSession()
  reconnectPrompt.value = null
}

onMounted(() => {
  if (route.value.name === 'home' && !showCreateFlow.value) checkLastSession()
})
</script>

<template>
  <div class="app">
    <!-- SOLO MODE -->
    <template v-if="route.name === 'home' && !showCreateFlow">
      <div v-if="reconnectPrompt" class="reconnect-banner">
        <span class="reconnect-text">
          Gjenoppta spillet som <strong>{{ reconnectPrompt.name }}</strong>?
        </span>
        <div class="reconnect-actions">
          <button class="reconnect-yes" @click="acceptReconnect">Ja</button>
          <button class="reconnect-no" @click="dismissReconnect">Nei</button>
        </div>
      </div>

      <header class="app-header">
        <h1>To terninger</h1>
      </header>

      <main class="app-main" :class="{ 'app-main-top': activeTab !== 'dice' }">
        <DiceRoller v-if="activeTab === 'dice'" />
        <Statistics v-else-if="activeTab === 'stats'" />
        <SettingsPanel v-else-if="activeTab === 'settings'" />
        <AboutPage v-else-if="activeTab === 'about'" />
      </main>

      <div class="multiplayer-cta" v-if="activeTab === 'dice'">
        <button class="mp-btn" @click="openMultiplayer">Spill med flere</button>
      </div>

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
        <button :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Innstillinger</span>
        </button>
        <button :class="{ active: activeTab === 'about' }" @click="activeTab = 'about'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Om</span>
        </button>
      </nav>
    </template>

    <!-- CREATE MULTIPLAYER (name input before session exists) -->
    <template v-else-if="showCreateFlow">
      <header class="app-header">
        <button class="back-link" @click="navigate({ name: 'home' })">&#8592; Tilbake</button>
      </header>
      <main class="app-main">
        <MultiplayerGame session-id="__new__" />
      </main>
    </template>

    <!-- MULTIPLAYER SESSION -->
    <template v-else-if="route.name === 'session'">
      <MultiplayerGame :session-id="route.sessionId" />
    </template>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 600px;
  margin: 0 auto;
}

.reconnect-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  margin: 10px 12px 0;
  background: var(--accent-bg, #e6f0ff);
  border: 1px solid var(--accent);
  border-radius: 10px;
  color: var(--text);
  font-size: 14px;
}

.reconnect-text {
  flex: 1 1 auto;
  min-width: 0;
}

.reconnect-actions {
  display: flex;
  gap: 6px;
  flex: 0 0 auto;
}

.reconnect-yes,
.reconnect-no {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--accent);
}

.reconnect-yes {
  background: var(--accent);
  color: #fff;
}

.reconnect-no {
  background: transparent;
  color: var(--accent);
}

.app-header {
  text-align: center;
  padding: 12px 16px 4px;
}

.app-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.back-link {
  border: none;
  background: none;
  font-size: 15px;
  color: var(--accent);
  cursor: pointer;
  padding: 4px 0;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.app-main-top {
  justify-content: flex-start;
}

.multiplayer-cta {
  padding: 0 20px 8px;
  text-align: center;
}

.mp-btn {
  padding: 10px 24px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.mp-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
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

.tab-bar button.active {
  color: var(--accent);
}

.tab-bar button:hover {
  color: var(--text-secondary);
}

.tab-bar button.active:hover {
  color: var(--accent);
}

.tab-bar svg {
  width: 22px;
  height: 22px;
}
</style>
