<script setup lang="ts">
import { ref, computed } from 'vue'
import DiceFace from './DiceFace.vue'
import { useSettings } from '../composables/useSettings'
import { useStatistics } from '../composables/useStatistics'
import { useShake } from '../composables/useShake'
import { playDiceSound } from '../composables/useSound'

const { settings } = useSettings()
const { addRoll, getLastRollComment } = useStatistics()

const die1 = ref(1)
const die2 = ref(1)
const rolling = ref(false)
const hasRolled = ref(false)
const showResult = ref(false)
const sum = computed(() => die1.value + die2.value)
const comment = computed(() => hasRolled.value && showResult.value ? getLastRollComment() : null)

function randomDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

async function roll() {
  if (rolling.value) return
  rolling.value = true
  showResult.value = false

  if (settings.sound) {
    playDiceSound()
  }

  if (settings.animation) {
    const frames = 18
    const interval = 90
    for (let i = 0; i < frames; i++) {
      die1.value = randomDie()
      die2.value = randomDie()
      await new Promise(r => setTimeout(r, interval))
    }
  }

  // Final values
  die1.value = randomDie()
  die2.value = randomDie()
  addRoll(die1.value, die2.value)
  hasRolled.value = true
  rolling.value = false
  showResult.value = true
}

useShake(roll)
</script>

<template>
  <div class="dice-roller" @click="roll">
    <div
      class="sum-display"
      :class="{
        'robber': settings.catanMode && showResult && sum === 7,
        'visible': hasRolled && showResult,
      }"
    >
      <div class="sum-number">{{ hasRolled && showResult ? sum : '?' }}</div>
      <div v-if="settings.catanMode && showResult && sum === 7" class="robber-text">
        Flytt røveren!
      </div>
    </div>

    <div class="dice-container" :class="{ rolling: rolling && settings.animation }">
      <DiceFace :value="die1" />
      <DiceFace :value="die2" />
    </div>

    <div class="roll-hint" :class="{ faded: hasRolled }">
      {{ hasRolled ? 'Trykk for å kaste igjen' : 'Trykk for å kaste' }}
    </div>

    <div v-if="comment" class="comment">{{ comment }}</div>
  </div>
</template>

<style scoped>
.dice-roller {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  padding: 20px;
  min-height: 320px;
}

.sum-display {
  font-size: 64px;
  font-weight: 900;
  color: #222;
  border-radius: 16px;
  padding: 8px 32px;
  transition: all 0.3s ease;
  opacity: 0;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sum-display.visible {
  opacity: 1;
}

.sum-display.robber {
  background: #dc2626;
  color: white;
  border: 4px solid #991b1b;
  box-shadow: 0 0 30px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.3);
  animation: robber-pulse 0.6s ease-in-out infinite alternate;
}

@keyframes robber-pulse {
  from { box-shadow: 0 0 30px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.3); }
  to { box-shadow: 0 0 40px rgba(220, 38, 38, 0.8), 0 0 80px rgba(220, 38, 38, 0.5); }
}

.sum-number {
  line-height: 1;
}

.robber-text {
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 4px;
}

.dice-container {
  display: flex;
  gap: 24px;
}

.dice-container.rolling {
  animation: shake 1.6s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(-8deg) translateX(-4px); }
  20% { transform: rotate(6deg) translateX(4px); }
  30% { transform: rotate(-6deg) translateX(-2px); }
  40% { transform: rotate(4deg) translateX(2px); }
  50% { transform: rotate(-4deg) translateX(-2px); }
  60% { transform: rotate(3deg) translateX(1px); }
  70% { transform: rotate(-2deg); }
  80% { transform: rotate(1deg); }
  90% { transform: rotate(-0.5deg); }
}

.roll-hint {
  font-size: 14px;
  color: #888;
  transition: opacity 0.3s;
}

.roll-hint.faded {
  opacity: 0.6;
}

.comment {
  font-size: 14px;
  color: #666;
  background: #f0f0f0;
  padding: 8px 16px;
  border-radius: 8px;
  text-align: center;
  max-width: 300px;
}
</style>
