<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '../composables/useSettings'
import { requestShakePermission } from '../composables/useShake'

const { settings } = useSettings()
const shakePermissionDenied = ref(false)

async function toggleShake() {
  if (!settings.shakeToRoll) {
    // Turning ON — request permission now (this is inside a click handler = user gesture)
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
</script>

<template>
  <div class="settings-panel">
    <h2>Innstillinger</h2>

    <label class="setting-row">
      <span>Animasjon</span>
      <input type="checkbox" v-model="settings.animation" />
    </label>

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

    <label class="setting-row">
      <span>Settlers of Catan-modus</span>
      <input type="checkbox" v-model="settings.catanMode" />
    </label>

    <p class="setting-hint" v-if="settings.catanMode">
      Summen vises stort. Rød alarm ved 7 (røveren).
    </p>
    <p class="setting-hint" v-else>
      Vanlig terningmodus uten spesialregler.
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
  margin: 0 0 16px 0;
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

.setting-hint {
  font-size: 13px;
  color: #888;
  margin-top: 12px;
}
</style>
