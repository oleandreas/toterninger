import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCli-nugD7gSf-JXRinCkqTwyE7S41Mk2g',
  authDomain: 'toterninger-a33e8.firebaseapp.com',
  projectId: 'toterninger-a33e8',
  storageBucket: 'toterninger-a33e8.firebasestorage.app',
  messagingSenderId: '78585809536',
  appId: '1:78585809536:web:6387c5f880ef862860b465',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
