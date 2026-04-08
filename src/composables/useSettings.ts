import { reactive, watch } from 'vue'

export type AnimationSpeed = 'fast' | 'medium' | 'slow'

export interface Settings {
  animation: boolean
  animationSpeed: AnimationSpeed
  sound: boolean
  catanMode: boolean
  shakeToRoll: boolean
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
  return { animation: true, animationSpeed: 'medium' as AnimationSpeed, sound: true, catanMode: true, shakeToRoll: false }
}

const settings = reactive<Settings>(loadSettings())

watch(settings, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useSettings() {
  return { settings }
}
