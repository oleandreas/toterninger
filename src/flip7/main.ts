import { createApp } from 'vue'
import '../style.css'
import { useSettings } from '../composables/useSettings'
import Flip7App from './Flip7App.vue'

// Reuse the shared theme (light / dark / neon) chosen on the main app.
useSettings()

createApp(Flip7App).mount('#app')
