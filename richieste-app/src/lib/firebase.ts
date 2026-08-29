import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)

// Le notifiche push funzionano solo nel browser (non durante il build su
// server), quindi la inizializziamo in modo "pigro" e sicuro: se il browser
// non la supporta (es. Safari vecchio), restituisce semplicemente null
// invece di far crashare l'app.
let messagingInstance: Messaging | null = null
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  if (messagingInstance) return messagingInstance
  const supported = await isSupported().catch(() => false)
  if (!supported) return null
  messagingInstance = getMessaging(app)
  return messagingInstance
}
