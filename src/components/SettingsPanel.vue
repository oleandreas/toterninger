<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '../composables/useSettings'
import type { GameMode } from '../composables/useSettings'
import { requestShakePermission } from '../composables/useShake'

const { settings } = useSettings()
const shakePermissionDenied = ref(false)

async function toggleShake() {
  if (!settings.shakeToRoll) {
    const granted = await requestShakePermission()
    if (granted) {
      settings.shakeToRoll = true
      shakePermissionDenied.value = false
    } else {
      shakePermissionDenied.value = true
    }
  } else {
    settings.shakeToRoll = false
  }
}

function setGameMode(mode: GameMode) {
  settings.gameMode = mode
  if (mode === 'catan' || mode === 'catan-ck') {
    settings.diceCount = 2
  }
}

</script>

<template>
  <div class="settings-panel">

    <!-- GAME PRESETS -->
    <h2>Spill</h2>

    <div class="game-modes">
      <button
        class="game-mode-btn"
        :class="{ active: settings.gameMode === 'standard' }"
        @click="setGameMode('standard')"
      >
        <span class="gm-icon">🎲</span>
        <span class="gm-title">Vanlige terninger</span>
        <span class="gm-desc">Velg antall terninger fritt</span>
      </button>

      <button
        class="game-mode-btn"
        :class="{ active: settings.gameMode === 'catan' }"
        @click="setGameMode('catan')"
      >
        <span class="gm-icon">🏝️</span>
        <span class="gm-title">Settlers of Catan</span>
        <span class="gm-desc">2 terninger, røveralarm ved 7</span>
      </button>

      <button
        class="game-mode-btn"
        :class="{ active: settings.gameMode === 'catan-ck' }"
        @click="setGameMode('catan-ck')"
      >
        <span class="gm-icon">⚔️</span>
        <span class="gm-title">Byer og Riddere</span>
        <span class="gm-desc">Rød + hvit terning, hendelsesterning</span>
      </button>
    </div>

    <!-- DICE COUNT (only for standard mode) -->
    <div v-if="settings.gameMode === 'standard'" class="setting-row">
      <span>Antall terninger</span>
      <div class="dice-count">
        <button @click="settings.diceCount = Math.max(1, settings.diceCount - 1)" :disabled="settings.diceCount <= 1">−</button>
        <span class="dice-count-value">{{ settings.diceCount }}</span>
        <button @click="settings.diceCount = Math.min(6, settings.diceCount + 1)" :disabled="settings.diceCount >= 6">+</button>
      </div>
    </div>

    <p class="setting-hint" v-if="settings.gameMode === 'catan'">
      Summen vises stort. Rød alarm ved 7 (røveren).
    </p>
    <p class="setting-hint" v-else-if="settings.gameMode === 'catan-ck'">
      Rød og hvit terning + hendelsesterning med barbarer og fremskritt.
    </p>

    <!-- GENERAL SETTINGS -->
    <h2 class="section-title">Generelt</h2>

    <label class="setting-row">
      <span>Animasjon</span>
      <input type="checkbox" v-model="settings.animation" />
    </label>

    <div v-if="settings.animation" class="setting-row">
      <span>Animasjonshastighet</span>
      <div class="speed-buttons">
        <button :class="{ active: settings.animationSpeed === 'fast' }" @click="settings.animationSpeed = 'fast'">Rask</button>
        <button :class="{ active: settings.animationSpeed === 'medium' }" @click="settings.animationSpeed = 'medium'">Middels</button>
        <button :class="{ active: settings.animationSpeed === 'slow' }" @click="settings.animationSpeed = 'slow'">Langsom</button>
      </div>
    </div>

    <label class="setting-row">
      <span>Lydeffekt</span>
      <input type="checkbox" v-model="settings.sound" />
    </label>

    <label class="setting-row" @click.prevent="toggleShake">
      <span>Rist for å kaste</span>
      <input type="checkbox" :checked="settings.shakeToRoll" />
    </label>

    <p class="setting-hint" v-if="shakePermissionDenied">
      Tilgang til bevegelsessensor ble avslått. Sjekk nettleserinnstillingene.
    </p>
    <p class="setting-hint" v-else-if="settings.shakeToRoll">
      Rist telefonen for å kaste terningene.
    </p>
  </div>
</template>

<style scoped>
.settings-panel {
  padding: 16px;
  max-width: 400px;
  margin: 0 auto;
}

.settings-panel h2 {
  font-size: 20px;
  margin: 0 0 12px 0;
}

.section-title {
  margin-top: 24px !important;
}

.game-modes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.game-mode-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.game-mode-btn:hover {
  border-color: #ccc;
}

.game-mode-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.gm-icon {
  font-size: 28px;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.gm-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
  display: block;
}

.gm-desc {
  font-size: 12px;
  color: #888;
  display: block;
  margin-top: 1px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  font-size: 15px;
}

.setting-row input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #3b82f6;
  pointer-events: none;
}

.dice-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dice-count button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f5f5f5;
  font-size: 18px;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.dice-count button:disabled {
  opacity: 0.3;
  cursor: default;
}

.dice-count-value {
  font-size: 18px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.speed-buttons {
  display: flex;
  gap: 4px;
}

.speed-buttons button {
  padding: 5px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f5f5f5;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.speed-buttons button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.setting-hint {
  font-size: 13px;
  color: #888;
  margin-top: 12px;
}
</style>
