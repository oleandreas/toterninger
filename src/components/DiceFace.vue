<script setup lang="ts">
withDefaults(defineProps<{
  value: number
  color?: 'white' | 'red'
}>(), { color: 'white' })
</script>

<template>
  <div class="dice-face" :class="[`dice-${value}`, `dice-color-${color}`]">
    <span v-for="n in value" :key="n" class="dot" />
  </div>
</template>

<style scoped>
.dice-face {
  width: 90px;
  height: 90px;
  background: #fff;
  border-radius: 14px;
  border: 3px solid #333;
  display: grid;
  padding: 12px;
  box-shadow: 2px 3px 8px rgba(0,0,0,0.25);
}

.dot {
  width: 16px;
  height: 16px;
  background: #222;
  border-radius: 50%;
  align-self: center;
  justify-self: center;
}

/* 1 */
.dice-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  place-items: center;
}

/* 2 */
.dice-2 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}
.dice-2 .dot:nth-child(1) { align-self: start; justify-self: start; }
.dice-2 .dot:nth-child(2) { align-self: end; justify-self: end; }

/* 3 */
.dice-3 {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
}
.dice-3 .dot:nth-child(1) { align-self: start; justify-self: start; }
.dice-3 .dot:nth-child(2) { align-self: center; justify-self: center; }
.dice-3 .dot:nth-child(3) { align-self: end; justify-self: end; }

/* 4 */
.dice-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

/* 5 */
.dice-5 {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}
.dice-5 .dot:nth-child(1) { grid-area: 1 / 1; align-self: start; justify-self: start; }
.dice-5 .dot:nth-child(2) { grid-area: 1 / 3; align-self: start; justify-self: end; }
.dice-5 .dot:nth-child(3) { grid-area: 2 / 2; align-self: center; justify-self: center; }
.dice-5 .dot:nth-child(4) { grid-area: 3 / 1; align-self: end; justify-self: start; }
.dice-5 .dot:nth-child(5) { grid-area: 3 / 3; align-self: end; justify-self: end; }

/* 6 */
.dice-6 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}

/* Red die */
.dice-color-red {
  background: #dc2626;
  border-color: #991b1b;
}
.dice-color-red .dot {
  background: #fff;
}
</style>
