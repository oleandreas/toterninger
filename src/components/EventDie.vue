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
  width: 90px;
  height: 90px;
  border-radius: 14px;
  border: 3px solid #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  box-shadow: 2px 3px 8px rgba(0,0,0,0.25);
  background: #fff;
}

.event-icon {
  font-size: 32px;
  line-height: 1;
}

.event-label {
  font-size: 10px;
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
