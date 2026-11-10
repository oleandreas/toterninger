import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCli-nugD7gSf-JXRinCkqTwyE7S41Mk2g',
  authDomain: 'toterninger-a33e8.firebaseapp.com',
  projectId: 'toterninger-a33e8',
  storageBucket: 'toterninger-a33e8.firebasestorage.app',
  messagingSenderId: '78585809536',
  appId: '1:78585809536:web:6387c5f880ef862860b465',
}

// Local Firestore emulator (see .env.emulator / .env.demo and vitest.config.ts):
//   'proxy'     → talk to the emulator through the Vite dev server (same origin, so it
//                 works from phones on the LAN and over HTTPS without mixed-content errors)
//   'host:port' → connect straight to the emulator (Node tests)
// A demo-* project id guarantees the SDK can never reach the production database.
const emulator = import.meta.env.VITE_FIRESTORE_EMULATOR as string | undefined

export const usingEmulator = !!emulator

const app = initializeApp(
  emulator ? { projectId: 'demo-toterninger', apiKey: 'demo-key' } : firebaseConfig,
)

function createDb() {
  if (emulator === 'proxy') {
    return initializeFirestore(app, {
      host: window.location.host,
      ssl: window.location.protocol === 'https:',
    })
  }
  const db = getFirestore(app)
  if (emulator) {
    const [host, port] = emulator.split(':')
    connectFirestoreEmulator(db, host, Number(port))
  }
  return db
}

export const db = createDb()
