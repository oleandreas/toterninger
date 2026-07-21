<script setup lang="ts">
import { ref, computed } from 'vue'
import { NUMBER_CARDS, BONUS_CARDS, FLIP7_BONUS, scoreRound } from './useFlip7'

const props = defineProps<{ playerName: string; initial?: number }>()
const emit = defineEmits<{ (e: 'confirm', score: number): void; (e: 'cancel'): void }>()

const numbers = ref<Set<number>>(new Set())
const bonuses = ref<Set<number>>(new Set())
const x2 = ref(false)
const bust = ref(false)

function toggleNumber(n: number) {
  if (bust.value) return
  if (numbers.value.has(n)) numbers.value.delete(n)
  else numbers.value.add(n)
  numbers.value = new Set(numbers.value)
}

function toggleBonus(n: number) {
  if (bust.value) return
  if (bonuses.value.has(n)) bonuses.value.delete(n)
  else bonuses.value.add(n)
  bonuses.value = new Set(bonuses.value)
}

function toggleX2() {
  if (bust.value) return
  x2.value = !x2.value
}

function toggleBust() {
  bust.value = !bust.value
  if (bust.value) {
    numbers.value = new Set()
    bonuses.value = new Set()
    x2.value = false
  }
}

const flip7 = computed(() => numbers.value.size >= 7)

const score = computed(() =>
  scoreRound({
    numbers: Array.from(numbers.value),
    bonuses: Array.from(bonuses.value),
    x2: x2.value,
    bust: bust.value,
  })
)
</script>

<template>
  <div class="calc-overlay" @click.self="emit('cancel')">
    <div class="calc">
      <header class="calc-head">
        <div class="calc-title">
          <span class="calc-for">Runde for</span>
          <strong>{{ playerName }}</strong>
        </div>
        <button class="calc-close" @click="emit('cancel')" aria-label="Lukk">&times;</button>
      </header>

      <div class="calc-score" :class="{ bust }">
        <span class="calc-score-num">{{ score }}</span>
        <span class="calc-score-label">
          <template v-if="bust">Sprakk – 0 poeng</template>
          <template v-else-if="flip7">Flip 7! +{{ FLIP7_BONUS }} bonus</template>
          <template v-else>poeng</template>
        </span>
      </div>

      <section class="calc-section">
        <h3>Tallkort <span class="hint">(unike – dubletter sprekker)</span></h3>
        <div class="grid grid-numbers">
          <button
            v-for="n in NUMBER_CARDS"
            :key="n"
            class="card num"
            :class="{ on: numbers.has(n) }"
            :disabled="bust"
            @click="toggleNumber(n)"
          >{{ n }}</button>
        </div>
      </section>

      <section class="calc-section">
        <h3>Modifikatorer</h3>
        <div class="grid grid-bonus">
          <button
            v-for="b in BONUS_CARDS"
            :key="b"
            class="card bonus"
            :class="{ on: bonuses.has(b) }"
            :disabled="bust"
            @click="toggleBonus(b)"
          >+{{ b }}</button>
          <button
            class="card mult"
            :class="{ on: x2 }"
            :disabled="bust"
            @click="toggleX2"
          >&times;2</button>
        </div>
      </section>

      <section class="calc-section">
        <button class="bust-btn" :class="{ on: bust }" @click="toggleBust">
          {{ bust ? 'Sprakk ✓' : 'Sprakk (0 poeng)' }}
        </button>
      </section>

      <footer class="calc-actions">
        <button class="btn-secondary" @click="emit('cancel')">Avbryt</button>
        <button class="btn-primary" @click="emit('confirm', score)">Lagre {{ score }} poeng</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.calc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
  padding: 0;
}

.calc {
  width: 100%;
  max-width: 600px;
  max-height: 92dvh;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: 16px 16px 0 0;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.3);
}

@media (min-width: 620px) {
  .calc-overlay { align-items: center; }
  .calc { border-radius: 16px; }
}

.calc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.calc-title { display: flex; flex-direction: column; line-height: 1.2; }
.calc-for { font-size: 12px; color: var(--text-muted); }
.calc-title strong { font-size: 18px; color: var(--text); }

.calc-close {
  border: none;
  background: none;
  font-size: 28px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 6px;
}

.calc-score {
  display: flex;
  align-items: baseline;
  gap: 10px;
  justify-content: center;
  padding: 10px;
  margin-bottom: 12px;
  background: var(--accent-bg);
  border: 1px solid var(--accent);
  border-radius: 12px;
}

.calc-score.bust {
  background: var(--danger-bg);
  border-color: var(--danger);
}

.calc-score-num { font-size: 34px; font-weight: 800; color: var(--accent); }
.calc-score.bust .calc-score-num { color: var(--danger); }
.calc-score-label { font-size: 13px; color: var(--text-secondary); }

.calc-section { margin-bottom: 14px; }

.calc-section h3 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-faint);
}

.grid { display: grid; gap: 8px; }
.grid-numbers { grid-template-columns: repeat(7, 1fr); }
.grid-bonus { grid-template-columns: repeat(6, 1fr); }

.card {
  aspect-ratio: 3 / 4;
  border: 2px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  border-radius: 11px;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: transform 0.08s, background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.card:active { transform: scale(0.94); }
.card:disabled { opacity: 0.35; cursor: not-allowed; }

.card.num.on {
  background: var(--flip7-teal, var(--accent));
  border-color: var(--flip7-teal, var(--accent));
  color: #fff;
  box-shadow: 0 4px 12px rgba(18, 163, 148, 0.4);
  transform: translateY(-2px);
}

.card.bonus.on {
  background: var(--flip7-coral, var(--danger));
  border-color: var(--flip7-coral, var(--danger));
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 91, 59, 0.4);
  transform: translateY(-2px);
}

.card.mult.on {
  background: var(--flip7-gold, var(--warning));
  border-color: var(--flip7-gold, var(--warning));
  color: #26403c;
  box-shadow: 0 4px 12px rgba(244, 180, 26, 0.45);
  transform: translateY(-2px);
}

.bust-btn {
  width: 100%;
  padding: 12px;
  border: 1.5px solid var(--danger);
  background: transparent;
  color: var(--danger);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.bust-btn.on {
  background: var(--danger);
  color: #fff;
}

.calc-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 13px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--border);
}

.btn-secondary { background: var(--bg-subtle); color: var(--text-secondary); }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
</style>
