<script setup lang="ts">
import { ref } from 'vue'
import DiceRoller from './components/DiceRoller.vue'
import Statistics from './components/Statistics.vue'
import SettingsPanel from './components/SettingsPanel.vue'

type Tab = 'dice' | 'stats' | 'settings'
const activeTab = ref<Tab>('dice')
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Toterninger</h1>
    </header>

    <main class="app-main">
      <DiceRoller v-if="activeTab === 'dice'" />
      <Statistics v-else-if="activeTab === 'stats'" />
      <SettingsPanel v-else-if="activeTab === 'settings'" />
    </main>

    <nav class="tab-bar">
      <button
        :class="{ active: activeTab === 'dice' }"
        @click="activeTab = 'dice'"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        <span>Kast</span>
      </button>
      <button
        :class="{ active: activeTab === 'stats' }"
        @click="activeTab = 'stats'"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="14" width="4" height="7" rx="1" />
          <rect x="10" y="8" width="4" height="13" rx="1" />
          <rect x="16" y="4" width="4" height="17" rx="1" />
        </svg>
        <span>Statistikk</span>
      </button>
      <button
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>Innstillinger</span>
      </button>
    </nav>
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

.app-header {
  text-align: center;
  padding: 12px 16px 4px;
}

.app-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #222;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

.tab-bar button:hover {
  color: #555;
}

.tab-bar button.active:hover {
  color: #3b82f6;
}

.tab-bar svg {
  width: 22px;
  height: 22px;
}
</style>
