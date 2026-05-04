import { reactive, watch } from 'vue'

export type AnimationSpeed = 'fast' | 'medium' | 'slow'
export type GameMode = 'standard' | 'catan' | 'catan-ck'
export type Theme = 'light' | 'dark' | 'neon'
export type TurnTimeout = number | 'manual' | 'admin'

export interface Settings {
  animation: boolean
  animationSpeed: AnimationSpeed
  sound: boolean
  gameMode: GameMode
  diceCount: number
  shakeToRoll: boolean
  turnTimeout: TurnTimeout // seconds (number) | 'manual' (active player advances) | 'admin' (host advances)
  theme: Theme
}

const STORAGE_KEY = 'toterninger-settings'

function defaultSettings(): Settings {
  return {
    animation: true,
    animationSpeed: 'medium' as AnimationSpeed,
    sound: true,
    gameMode: 'catan' as GameMode,
    diceCount: 2,
    shakeToRoll: false,
    turnTimeout: 30,
    theme: 'light' as Theme,
  }
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Migrate old catanMode boolean
      if ('catanMode' in parsed && !('gameMode' in parsed)) {
        parsed.gameMode = parsed.catanMode ? 'catan' : 'standard'
        delete parsed.catanMode
      }
      return { ...defaultSettings(), ...parsed }
    }
  } catch {}
  return defaultSettings()
}

const settings = reactive<Settings>(loadSettings())

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

applyTheme(settings.theme)

watch(settings, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  applyTheme(val.theme)
}, { deep: true })

export function useSettings() {
  return { settings }
}
