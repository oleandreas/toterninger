import { reactive, watch } from 'vue'

export interface Settings {
  animation: boolean
  sound: boolean
  catanMode: boolean
}

const STORAGE_KEY = 'toterninger-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...defaultSettings(), ...JSON.parse(stored) }
  } catch {}
  return defaultSettings()
}

function defaultSettings(): Settings {
  return { animation: true, sound: true, catanMode: true }
}

const settings = reactive<Settings>(loadSettings())

watch(settings, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useSettings() {
  return { settings }
}
