import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './composables/useWakeLock' // side-effect: applies the keepAwake setting app-wide

createApp(App).mount('#app')
