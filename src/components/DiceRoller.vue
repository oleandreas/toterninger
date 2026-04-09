<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import DiceFace from './DiceFace.vue'
import EventDie from './EventDie.vue'
import type { EventDieValue } from './EventDie.vue'
import { useSettings } from '../composables/useSettings'
import type { AnimationSpeed } from '../composables/useSettings'
import { useStatistics, statisticsKey } from '../composables/useStatistics'
import { useShake } from '../composables/useShake'
import { playDiceSound } from '../composables/useSound'

const props = withDefaults(defineProps<{
  disabled?: boolean
}>(), { disabled: false })

const { settings } = useSettings()
const stats = inject(statisticsKey, undefined) ?? useStatistics()
const { addRoll, getLastRollComment } = stats

const dice = ref<number[]>([1, 1])
const eventDieValue = ref<EventDieValue>('ship')
const rolling = ref(false)
const hasRolled = ref(false)
const showResult = ref(false)

const isCatan = computed(() => settings.gameMode === 'catan' || settings.gameMode === 'catan-ck')
const isCK = computed(() => settings.gameMode === 'catan-ck')

const sum = computed(() => dice.value.reduce((a, b) => a + b, 0))
const comment = computed(() => hasRolled.value && showResult.value ? getLastRollComment() : null)

const speedConfig: Record<AnimationSpeed, { frames: number; interval: number }> = {
  fast:   { frames: 8,  interval: 60 },
  medium: { frames: 16, interval: 90 },
  slow:   { frames: 24, interval: 125 },
}

const shakeDuration = computed(() => {
  const cfg = speedConfig[settings.animationSpeed]
  return `${(cfg.frames * cfg.interval) / 1000}s`
})

const eventDieValues: EventDieValue[] = ['ship', 'ship', 'ship', 'green', 'blue', 'yellow']

function randomDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

function randomEventDie(): EventDieValue {
  return eventDieValues[Math.floor(Math.random() * 6)]
}

function diceCount(): number {
  if (isCatan.value) return 2
  return settings.diceCount
}

async function roll() {
  if (rolling.value || props.disabled) return
  rolling.value = true
  showResult.value = false

  if (settings.sound) {
    playDiceSound()
  }

  const count = diceCount()

  if (settings.animation) {
    const { frames, interval } = speedConfig[settings.animationSpeed]
    for (let i = 0; i < frames; i++) {
      dice.value = Array.from({ length: count }, randomDie)
      if (isCK.value) eventDieValue.value = randomEventDie()
      await new Promise(r => setTimeout(r, interval))
    }
  }

  dice.value = Array.from({ length: count }, randomDie)
  if (isCK.value) eventDieValue.value = randomEventDie()

  await addRoll(dice.value[0], dice.value[1] ?? 0)
  hasRolled.value = true
  rolling.value = false
  showResult.value = true
}

useShake(roll)
</script>

<template>
  <div class="dice-roller" :class="{ disabled }" @click="roll">
    <div
      class="sum-display"
      :class="{
        'robber': isCatan && showResult && sum === 7,
        'visible': hasRolled && showResult,
      }"
    >
      <div class="sum-number">{{ hasRolled && showResult ? sum : '?' }}</div>
      <div v-if="isCatan && showResult && sum === 7" class="robber-text">
        Flytt røveren!
      </div>
    </div>

    <div class="dice-container" :class="{ rolling: rolling && settings.animation }">
      <!-- Standard / Catan: white dice -->
      <template v-if="settings.gameMode === 'standard' || settings.gameMode === 'catan'">
        <DiceFace v-for="(d, i) in dice" :key="i" :value="d" />
      </template>

      <!-- Cities & Knights: red + white + event die -->
      <template v-if="settings.gameMode === 'catan-ck'">
        <DiceFace :value="dice[0]" color="red" />
        <DiceFace :value="dice[1]" color="white" />
        <EventDie :value="eventDieValue" />
      </template>
    </div>

    <!-- C&K: show event die result -->
    <div v-if="isCK && hasRolled && showResult" class="event-result" :class="`event-result-${eventDieValue}`">
      <template v-if="eventDieValue === 'ship'">
        Barbarene rykker frem!
      </template>
      <template v-else-if="eventDieValue === 'green'">
        Vitenskap (grønn) &mdash; terning: {{ dice[0] }}
      </template>
      <template v-else-if="eventDieValue === 'blue'">
        Politikk (blå) &mdash; terning: {{ dice[0] }}
      </template>
      <template v-else-if="eventDieValue === 'yellow'">
        Handel (gul) &mdash; terning: {{ dice[0] }}
      </template>
    </div>

    <div class="roll-hint" :class="{ faded: hasRolled }">
      <template v-if="disabled">Venter på tur...</template>
      <template v-else-if="hasRolled">Trykk for å kaste igjen</template>
      <template v-else>Trykk for å kaste</template>
    </div>

    <div v-if="comment" class="comment">{{ comment }}</div>
  </div>
</template>

<style scoped>
.dice-roller {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  padding: 20px;
  min-height: 320px;
}

.dice-roller.disabled {
  cursor: default;
  opacity: 0.6;
}

.sum-display {
  font-size: 64px;
  font-weight: 900;
  color: var(--text);
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
  background: var(--danger);
  color: white;
  border: 4px solid var(--danger-border);
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
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.dice-container.rolling {
  animation: shake v-bind(shakeDuration) ease-in-out;
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

.event-result {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 8px;
  text-align: center;
}

.event-result-ship {
  background: #fef2f2;
  color: #991b1b;
}

.event-result-green {
  background: #f0fdf4;
  color: #16a34a;
}

.event-result-blue {
  background: #eff6ff;
  color: #2563eb;
}

.event-result-yellow {
  background: #fefce8;
  color: #ca8a04;
}

.roll-hint {
  font-size: 14px;
  color: var(--text-muted);
  transition: opacity 0.3s;
}

.roll-hint.faded {
  opacity: 0.6;
}

.comment {
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  padding: 8px 16px;
  border-radius: 8px;
  text-align: center;
  max-width: 300px;
}
</style>
