<script setup lang="ts">
import { wakeLockSupported, wakeLockWanted, toggleGameWakeLock } from '../composables/useWakeLock'
</script>

<template>
  <button
    v-if="wakeLockSupported"
    class="wake-toggle"
    :class="{ on: wakeLockWanted }"
    :aria-pressed="wakeLockWanted"
    :aria-label="wakeLockWanted ? 'La skjermen slukke' : 'Hold skjermen våken'"
    :title="wakeLockWanted ? 'Skjermen holdes våken' : 'Skjermen kan slukke'"
    @click="toggleGameWakeLock"
  >
    <svg v-if="wakeLockWanted" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
    <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<style scoped>
.wake-toggle {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.wake-toggle.on {
  color: var(--accent);
}

.wake-toggle:hover {
  background: var(--bg-subtle);
}
</style>
