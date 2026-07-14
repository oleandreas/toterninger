<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from '../router'
import DiceRoller from './DiceRoller.vue'

const { navigate } = useRouter()

type Phase = 'setup' | 'playing'
const phase = ref<Phase>('setup')

const names = ref<string[]>(['', ''])
const players = ref<string[]>([])
const currentIndex = ref(0)
const hasRolledThisTurn = ref(false)

const validNames = computed(() => names.value.map(n => n.trim()).filter(Boolean))
const canStart = computed(() => validNames.value.length >= 2)

const currentName = computed(() => players.value[currentIndex.value] ?? '')
const nextName = computed(
  () => players.value[(currentIndex.value + 1) % players.value.length] ?? '',
)

function addName() {
  names.value.push('')
}

function removeName(index: number) {
  names.value.splice(index, 1)
  if (names.value.length < 2) names.value.push('')
}

function start() {
  if (!canStart.value) return
  players.value = validNames.value
  currentIndex.value = 0
  hasRolledThisTurn.value = false
  phase.value = 'playing'
}

function onRolled() {
  hasRolledThisTurn.value = true
}

function nextPlayer() {
  currentIndex.value = (currentIndex.value + 1) % players.value.length
  hasRolledThisTurn.value = false
}

function backToSetup() {
  phase.value = 'setup'
}

function leave() {
  navigate({ name: 'home' })
}
</script>

<template>
  <div class="local-game">
    <!-- SETUP -->
    <template v-if="phase === 'setup'">
      <header class="lg-header">
        <button class="back-link" @click="leave">&#8592; Tilbake</button>
        <h1>Hvem spiller?</h1>
      </header>

      <main class="lg-main">
        <p class="hint">Skriv inn deltakerne. Appen holder styr på hvem sin tur det er.</p>

        <div class="name-list">
          <div v-for="(_, i) in names" :key="i" class="name-row">
            <span class="name-index">{{ i + 1 }}.</span>
            <input
              v-model="names[i]"
              type="text"
              :placeholder="`Deltaker ${i + 1}`"
              maxlength="20"
              @keyup.enter="i === names.length - 1 ? addName() : undefined"
            />
            <button
              class="remove-btn"
              type="button"
              aria-label="Fjern deltaker"
              @click="removeName(i)"
            >&#10005;</button>
          </div>
        </div>

        <button class="add-btn" type="button" @click="addName">+ Legg til deltaker</button>

        <button class="start-btn" type="button" :disabled="!canStart" @click="start">
          Start spillet
        </button>
        <p v-if="!canStart" class="min-note">Legg inn minst to deltakere.</p>
      </main>
    </template>

    <!-- PLAYING -->
    <template v-else>
      <header class="lg-header playing">
        <button class="back-btn" aria-label="Avslutt" @click="leave">&#8592;</button>
        <h1>To terninger</h1>
        <button class="edit-btn" aria-label="Endre deltakere" @click="backToSetup">Deltakere</button>
      </header>

      <div class="turn-banner">
        <span class="turn-name">{{ currentName }}</span>
        <span class="turn-label">sin tur</span>
      </div>

      <main class="lg-play">
        <DiceRoller @rolled="onRolled" />
      </main>

      <div class="next-bar">
        <button class="next-btn" :class="{ ready: hasRolledThisTurn }" @click="nextPlayer">
          Neste: {{ nextName }} &#8594;
        </button>
      </div>

      <div class="order-strip">
        <span
          v-for="(p, i) in players"
          :key="i"
          class="order-chip"
          :class="{ current: i === currentIndex }"
        >{{ p }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.local-game {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 600px;
  margin: 0 auto;
}

.lg-header {
  text-align: center;
  padding: 12px 16px 4px;
}

.lg-header h1 {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.lg-header.playing {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.lg-header.playing h1 {
  flex: 1;
  margin: 0;
  font-size: 20px;
  text-align: center;
}

.back-link {
  border: none;
  background: none;
  font-size: 15px;
  color: var(--accent);
  cursor: pointer;
  padding: 4px 0;
  float: left;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 8px;
}

.back-btn:hover {
  background: var(--bg-subtle);
  color: var(--text);
}

.edit-btn {
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.edit-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.lg-main {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint {
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  margin: 4px 0 8px;
}

.name-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-index {
  color: var(--text-muted);
  font-size: 14px;
  width: 20px;
  text-align: right;
}

.name-row input {
  flex: 1;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text);
}

.name-row input:focus {
  outline: none;
  border-color: var(--accent);
}

.remove-btn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}

.remove-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: var(--danger-bg);
}

.add-btn {
  align-self: flex-start;
  border: none;
  background: none;
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.start-btn {
  margin-top: 8px;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.start-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.min-note {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.turn-banner {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin: 4px 16px 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  animation: pulse-turn 1.5s ease-in-out infinite alternate;
}

@keyframes pulse-turn {
  from { box-shadow: 0 0 0 0 rgba(99, 144, 240, 0.4); }
  to { box-shadow: 0 0 14px 4px rgba(99, 144, 240, 0.25); }
}

.turn-name {
  font-size: 22px;
  font-weight: 800;
}

.turn-label {
  font-size: 15px;
  opacity: 0.9;
}

.lg-play {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.next-bar {
  display: flex;
  justify-content: center;
  padding: 0 16px 8px;
}

.next-btn {
  padding: 12px 24px;
  border: 1px solid var(--accent);
  border-radius: 10px;
  background: transparent;
  color: var(--accent);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.next-btn.ready {
  background: var(--accent);
  color: #fff;
}

.next-btn:hover {
  opacity: 0.85;
}

.order-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  padding: 0 16px 16px;
}

.order-chip {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--bg-subtle);
  color: var(--text-muted);
  border: 1px solid transparent;
}

.order-chip.current {
  background: var(--accent-bg);
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 700;
}
</style>
