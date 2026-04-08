<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import QRCodeLib from 'qrcode'

const props = defineProps<{ url: string }>()
const dataUrl = ref('')

async function render() {
  try {
    dataUrl.value = await QRCodeLib.toDataURL(props.url, { width: 200, margin: 2 })
  } catch {}
}

onMounted(render)
watch(() => props.url, render)
</script>

<template>
  <img v-if="dataUrl" :src="dataUrl" alt="QR-kode" class="qr-code" />
</template>

<style scoped>
.qr-code {
  width: 200px;
  height: 200px;
  border-radius: 8px;
}
</style>
