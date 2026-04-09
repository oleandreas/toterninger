<script setup lang="ts">
export type EventDieValue = 'ship' | 'green' | 'blue' | 'yellow'

defineProps<{ value: EventDieValue }>()

const labels: Record<EventDieValue, string> = {
  ship: '⛵',
  green: '🏰',
  blue: '🏰',
  yellow: '🏰',
}
</script>

<template>
  <div class="event-die" :class="`event-${value}`">
    <span class="event-icon">{{ labels[value] }}</span>
    <span v-if="value === 'ship'" class="event-label">Barbar</span>
    <span v-else class="event-label castle-label">
      {{ value === 'green' ? 'Vitenskap' : value === 'blue' ? 'Politikk' : 'Handel' }}
    </span>
  </div>
</template>

<style scoped>
.event-die {
  width: min(90px, 22vw);
  height: min(90px, 22vw);
  border-radius: 14px;
  border: 3px solid var(--dice-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  box-shadow: 2px 3px 8px var(--dice-shadow);
  background: var(--bg-card);
}

.event-icon {
  font-size: min(32px, 8vw);
  line-height: 1;
}

.event-label {
  font-size: min(10px, 2.5vw);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-ship .event-icon { font-size: 36px; }
.event-ship { background: #fef2f2; border-color: #991b1b; }
.event-ship .event-label { color: #991b1b; }

.event-green { background: #f0fdf4; border-color: #16a34a; }
.event-green .event-label { color: #16a34a; }

.event-blue { background: #eff6ff; border-color: #2563eb; }
.event-blue .event-label { color: #2563eb; }

.event-yellow { background: #fefce8; border-color: #ca8a04; }
.event-yellow .event-label { color: #ca8a04; }
</style>
