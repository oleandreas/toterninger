<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useFlip7 } from './useFlip7'
import RoundCalculator from './RoundCalculator.vue'

const {
  state,
  totals,
  leaderId,
  winners,
  addPlayer,
  removePlayer,
  startGame,
  commitRound,
  removeRound,
  newGame,
  resetAll,
} = useFlip7()

// --- Setup ---
const newName = ref('')
function onAddPlayer() {
  addPlayer(newName.value)
  newName.value = ''
}

// --- Current round draft ---
const draft = reactive<Record<string, number | null>>({})

function draftValue(id: string): number | null {
  return id in draft ? draft[id] : null
}

const roundNumber = computed(() => state.rounds.length + 1)

const canSaveRound = computed(() =>
  state.players.some(p => draftValue(p.id) !== null)
)

function saveRound() {
  const scores: Record<string, number> = {}
  for (const p of state.players) scores[p.id] = draftValue(p.id) ?? 0
  commitRound(scores)
  for (const key of Object.keys(draft)) delete draft[key]
}

// --- Calculator modal ---
const calcFor = ref<{ id: string; name: string } | null>(null)
function openCalc(id: string, name: string) {
  calcFor.value = { id, name }
}
function onCalcConfirm(score: number) {
  if (calcFor.value) draft[calcFor.value.id] = score
  calcFor.value = null
}

function onManualInput(id: string, e: Event) {
  const raw = (e.target as HTMLInputElement).value
  draft[id] = raw === '' ? null : Number(raw)
}

// --- Menu ---
const menuOpen = ref(false)

// --- Rules ---
const showRules = ref(false)

function confirmNewGame() {
  if (confirm('Starte ny kamp? Spillerne beholdes, men alle runder nullstilles.')) {
    for (const key of Object.keys(draft)) delete draft[key]
    newGame()
  }
  menuOpen.value = false
}

function confirmResetAll() {
  if (confirm('Nullstille alt? Både spillere og poeng slettes.')) {
    for (const key of Object.keys(draft)) delete draft[key]
    resetAll()
  }
  menuOpen.value = false
}

function progressPct(id: string): number {
  return Math.min(100, ((totals.value[id] ?? 0) / state.target) * 100)
}

const rankedPlayers = computed(() =>
  [...state.players].sort((a, b) => (totals.value[b.id] ?? 0) - (totals.value[a.id] ?? 0))
)
</script>

<template>
  <div class="page flip7-page">
    <header class="head">
      <a class="home-link" href="/" aria-label="Til toterninger.no">&#8592;</a>
      <div class="flip7-logo" aria-label="Flip 7">
        <span class="fl-flip">FLIP</span><span class="fl-7">7</span>
      </div>
      <div class="head-actions">
        <button class="icon-btn" @click="showRules = true" aria-label="Regler">?</button>
        <button v-if="state.started" class="icon-btn" @click="menuOpen = !menuOpen" aria-label="Meny">&#8942;</button>
      </div>

      <div v-if="menuOpen" class="menu" @click.self="menuOpen = false">
        <div class="menu-card">
          <button @click="confirmNewGame">Ny kamp (behold spillere)</button>
          <button class="danger" @click="confirmResetAll">Nullstill alt</button>
          <button class="cancel" @click="menuOpen = false">Lukk</button>
        </div>
      </div>
    </header>

    <!-- ============ SETUP ============ -->
    <main v-if="!state.started" class="setup">
      <p class="tagline">Poengark for kortspillet Flip 7. Legg til spillere og hold styr på poengene – først til {{ state.target }} vinner.</p>

      <button class="rules-link" @click="showRules = true">📖 Slik spiller du Flip 7</button>

      <label class="target-row">
        <span>Poengmål</span>
        <input type="number" min="1" v-model.number="state.target" />
      </label>

      <div class="add-row">
        <input
          type="text"
          v-model="newName"
          placeholder="Spillernavn"
          maxlength="20"
          @keyup.enter="onAddPlayer"
        />
        <button class="add-btn" @click="onAddPlayer">Legg til</button>
      </div>

      <ul v-if="state.players.length" class="setup-players">
        <li v-for="p in state.players" :key="p.id">
          <span>{{ p.name }}</span>
          <button class="remove" @click="removePlayer(p.id)" aria-label="Fjern">&times;</button>
        </li>
      </ul>
      <p v-else class="empty">Ingen spillere ennå.</p>

      <button class="start-btn" :disabled="!state.players.length" @click="startGame">
        Start kampen
      </button>

      <button v-if="state.players.length" class="link-btn" @click="resetAll">Tøm spillere</button>
    </main>

    <!-- ============ GAME ============ -->
    <main v-else class="game">
      <div v-if="winners.length" class="winner-banner">
        🏆
        <template v-if="winners.length === 1">
          <strong>{{ winners[0].name }}</strong> vant med {{ totals[winners[0].id] }} poeng!
        </template>
        <template v-else>
          Uavgjort på topp: <strong>{{ winners.map(w => w.name).join(', ') }}</strong>
        </template>
      </div>

      <!-- Scoreboard -->
      <section class="board">
        <div
          v-for="(p, i) in rankedPlayers"
          :key="p.id"
          class="player-card"
          :class="{ leader: p.id === leaderId && (totals[p.id] ?? 0) > 0 }"
        >
          <div class="pc-top">
            <span class="pc-rank">{{ i + 1 }}</span>
            <span class="pc-name">{{ p.name }}</span>
            <span class="pc-total">{{ totals[p.id] ?? 0 }}</span>
          </div>
          <div class="pc-bar"><div class="pc-bar-fill" :style="{ width: progressPct(p.id) + '%' }"></div></div>
        </div>
      </section>

      <!-- Current round entry -->
      <section class="round-entry">
        <h2>Runde {{ roundNumber }}</h2>
        <div class="entry-list">
          <div v-for="p in state.players" :key="p.id" class="entry-row">
            <span class="entry-name">{{ p.name }}</span>
            <input
              class="entry-input"
              type="number"
              inputmode="numeric"
              placeholder="0"
              :value="draftValue(p.id)"
              @input="onManualInput(p.id, $event)"
            />
            <button class="calc-open" @click="openCalc(p.id, p.name)">🃏 Kort</button>
          </div>
        </div>
        <button class="save-round" :disabled="!canSaveRound" @click="saveRound">
          Lagre runde {{ roundNumber }}
        </button>
      </section>

      <!-- History -->
      <section v-if="state.rounds.length" class="history">
        <h2>Historikk</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="rnd-col">Rd.</th>
                <th v-for="p in state.players" :key="p.id">{{ p.name }}</th>
                <th class="del-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(round, ri) in state.rounds" :key="ri">
                <td class="rnd-col">{{ ri + 1 }}</td>
                <td v-for="p in state.players" :key="p.id" :class="{ zero: (round[p.id] ?? 0) === 0 }">
                  {{ round[p.id] ?? 0 }}
                </td>
                <td class="del-col">
                  <button class="row-del" @click="removeRound(ri)" aria-label="Slett runde">&times;</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="rnd-col">Sum</td>
                <td v-for="p in state.players" :key="p.id"><strong>{{ totals[p.id] ?? 0 }}</strong></td>
                <td class="del-col"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </main>

    <RoundCalculator
      v-if="calcFor"
      :player-name="calcFor.name"
      @confirm="onCalcConfirm"
      @cancel="calcFor = null"
    />

    <!-- ============ RULES ============ -->
    <div v-if="showRules" class="rules-overlay" @click.self="showRules = false">
      <div class="rules-card">
        <header class="rules-head">
          <h2>Slik spiller du Flip 7</h2>
          <button class="rules-close" @click="showRules = false" aria-label="Lukk">&times;</button>
        </header>

        <p class="rules-intro">
          Flip 7 er et «press-your-luck»-kortspill: trekk kort for å samle poeng – men blir du grådig, sprekker du.
          Først til <strong>{{ state.target }}</strong> poeng vinner. Dette arket holder styr på poengene mens dere spiller med kortene.
        </p>

        <h3>På tur</h3>
        <ul>
          <li><strong>Flipp</strong> – trekk et kort til, eller <strong>stopp</strong> for å sikre poengene du har samlet i runden.</li>
          <li>Runden varer til alle har stoppet eller sprukket – eller til noen får «Flip 7».</li>
        </ul>

        <h3>Kortene</h3>
        <ul>
          <li><strong>Tallkort 0–12</strong> – summen din for runden. Trekker du et tall du <em>allerede</em> har, <strong>sprekker</strong> du og får 0 poeng den runden.</li>
          <li><strong>7 ulike tallkort = «Flip 7»</strong> – runden avsluttes umiddelbart og du får <strong>+15 bonuspoeng</strong>.</li>
          <li><strong>Modifikatorer</strong> – <strong>+2, +4, +6, +8, +10</strong> legges til summen, og <strong>×2</strong> dobler summen av tallkortene.</li>
          <li><strong>Handlingskort</strong> – <em>Frys</em> (en spiller må stoppe), <em>Trekk tre</em> (må trekke tre kort på rad), <em>Andre sjanse</em> (redder deg fra én sprekk).</li>
        </ul>

        <h3>Poeng per runde</h3>
        <ul>
          <li>Summen av tallkortene dine, ganget med ×2 om du har det kortet, pluss modifikatorer, pluss 15 ved Flip 7.</li>
          <li>Sprakk du? Da får du <strong>0 poeng</strong> for runden.</li>
        </ul>

        <p class="rules-tip">
          💡 Bruk «🃏 Kort»-knappen ved hver spiller for å regne ut rundescoren automatisk, eller skriv tallet rett inn.
        </p>

        <button class="rules-done" @click="showRules = false">Skjønner!</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
}

.head h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.home-link {
  font-size: 22px;
  color: var(--accent);
  text-decoration: none;
  width: 64px;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  width: 64px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-subtle);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
}

.icon-btn:hover { background: var(--bg-hover); color: var(--text); }

.menu {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 56px 14px 0;
}

.menu-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  min-width: 220px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.menu-card button {
  text-align: left;
  padding: 11px 12px;
  border: none;
  background: none;
  color: var(--text);
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
}

.menu-card button:hover { background: var(--bg-hover); }
.menu-card button.danger { color: var(--danger); }
.menu-card button.cancel { color: var(--text-muted); }

/* ---------- Setup ---------- */
.setup {
  padding: 8px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tagline {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.target-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
}

.target-row input {
  width: 90px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text);
  font-size: 15px;
  text-align: right;
}

.add-row { display: flex; gap: 8px; }

.add-row input {
  flex: 1;
  padding: 11px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text);
  font-size: 15px;
}

.add-btn {
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.setup-players {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setup-players li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  color: var(--text);
}

.remove {
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.empty { color: var(--text-muted); font-size: 14px; margin: 0; }

.start-btn {
  margin-top: 4px;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: var(--success);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.link-btn {
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}

/* ---------- Game ---------- */
.game { padding: 4px 14px 24px; display: flex; flex-direction: column; gap: 18px; }

.winner-banner {
  padding: 14px;
  background: var(--warning-bg);
  border: 1px solid var(--warning);
  border-radius: 12px;
  text-align: center;
  font-size: 16px;
  color: var(--text);
}

.board { display: flex; flex-direction: column; gap: 8px; }

.player-card {
  padding: 11px 13px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.player-card.leader {
  border-color: var(--warning);
  box-shadow: 0 2px 10px rgba(244, 180, 26, 0.28);
}

.pc-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pc-rank {
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.player-card.leader .pc-rank { background: var(--warning); color: #1a1a1a; }

.pc-name { flex: 1; font-size: 16px; font-weight: 600; color: var(--text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-total { font-size: 20px; font-weight: 800; color: var(--text); }

.pc-bar { height: 6px; background: var(--bar-track); border-radius: 3px; overflow: hidden; }
.pc-bar-fill { height: 100%; background: var(--bar-fill); border-radius: 3px; transition: width 0.3s; }

.round-entry h2,
.history h2 {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.entry-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }

.entry-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entry-name { flex: 1; font-size: 15px; color: var(--text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.entry-input {
  width: 68px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text);
  font-size: 15px;
  text-align: right;
}

.calc-open {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.save-round {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.save-round:disabled { opacity: 0.5; cursor: not-allowed; }

.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; }

table { border-collapse: collapse; width: 100%; font-size: 14px; }

th, td {
  padding: 8px 10px;
  text-align: center;
  color: var(--text);
  white-space: nowrap;
}

thead th {
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-weight: 700;
  border-bottom: 1px solid var(--border);
}

tbody tr:nth-child(even) { background: var(--bg-subtle); }
tbody td.zero { color: var(--text-faint); }

tfoot td {
  border-top: 2px solid var(--border);
  background: var(--bg-card);
  font-size: 15px;
}

.rnd-col { color: var(--text-muted); font-weight: 600; }
.del-col { width: 34px; }

.row-del {
  border: none;
  background: none;
  color: var(--text-faint);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.row-del:hover { color: var(--danger); }

/* ---------- Rules ---------- */
.rules-link {
  align-self: flex-start;
  padding: 8px 0;
  border: none;
  background: none;
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.rules-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 60;
}

.rules-card {
  width: 100%;
  max-width: 600px;
  max-height: 92dvh;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: 16px 16px 0 0;
  padding: 16px 18px calc(20px + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.3);
}

@media (min-width: 620px) {
  .rules-overlay { align-items: center; }
  .rules-card { border-radius: 16px; }
}

.rules-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background: var(--bg-card);
  padding-bottom: 6px;
  margin-bottom: 4px;
}

.rules-head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

.rules-close {
  border: none;
  background: none;
  font-size: 28px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 6px;
}

.rules-card h3 {
  margin: 16px 0 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rules-intro,
.rules-card li {
  font-size: 15px;
  line-height: 1.55;
  color: var(--text);
}

.rules-intro { margin: 4px 0 8px; color: var(--text-secondary); }

.rules-card ul {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rules-tip {
  margin: 16px 0 4px;
  padding: 10px 12px;
  background: var(--accent-bg);
  border: 1px solid var(--accent);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
}

.rules-done {
  width: 100%;
  margin-top: 16px;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
</style>
