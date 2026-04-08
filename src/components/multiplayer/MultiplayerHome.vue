<script setup lang="ts">
import { ref } from 'vue'
import { useSession } from '../../composables/useSession'

const props = defineProps<{
  joinSessionId?: string
}>()

const emit = defineEmits<{
  joined: []
  created: [sessionId: string]
}>()

const { createSession, joinSession } = useSession()

const name = ref('')
const loading = ref(false)
const errorMsg = ref('')

const isJoining = !!props.joinSessionId

async function handleCreate() {
  if (!name.value.trim()) return
  loading.value = true
  errorMsg.value = ''
  try {
    const sessionId = await createSession(name.value.trim())
    emit('created', sessionId)
  } catch (e: any) {
    errorMsg.value = e.message || 'Kunne ikke opprette spill'
  } finally {
    loading.value = false
  }
}

async function handleJoin() {
  if (!name.value.trim() || !props.joinSessionId) return
  loading.value = true
  errorMsg.value = ''
  try {
    await joinSession(props.joinSessionId, name.value.trim())
    emit('joined')
  } catch (e: any) {
    errorMsg.value = e.message || 'Kunne ikke bli med'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="multiplayer-home">
    <h2 v-if="isJoining">Bli med i spill</h2>
    <h2 v-else>Spill med flere</h2>

    <div class="form">
      <label class="field">
        <span>Ditt navn</span>
        <input
          v-model="name"
          type="text"
          placeholder="Skriv inn navnet ditt"
          maxlength="20"
          @keyup.enter="isJoining ? handleJoin() : handleCreate()"
        />
      </label>

      <button
        class="primary-btn"
        :disabled="!name.trim() || loading"
        @click="isJoining ? handleJoin() : handleCreate()"
      >
        {{ loading ? 'Venter...' : isJoining ? 'Bli med' : 'Opprett spill' }}
      </button>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<style scoped>
.multiplayer-home {
  padding: 24px 16px;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

h2 {
  font-size: 22px;
  margin: 0 0 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  font-size: 14px;
  color: #666;
}

.field input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.field input:focus {
  border-color: #3b82f6;
}

.primary-btn {
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-btn:hover:not(:disabled) {
  background: #2563eb;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.error {
  color: #dc2626;
  font-size: 14px;
  margin: 0;
}
</style>
