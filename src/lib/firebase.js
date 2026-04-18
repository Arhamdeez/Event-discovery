import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  ...(databaseURL ? { databaseURL } : {}),
}

let app = null
export let auth = null
export let db = null
export let analytics = null
export let firebaseInitError = null

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error(
      'Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID to .env (see .env.example), then restart the dev server.',
    )
  }
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)

  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    isSupported()
      .then((ok) => {
        if (ok && app) {
          analytics = getAnalytics(app)
        }
      })
      .catch(() => {
        /* analytics unavailable (e.g. blocked) */
      })
  }
} catch (err) {
  firebaseInitError = err
}
