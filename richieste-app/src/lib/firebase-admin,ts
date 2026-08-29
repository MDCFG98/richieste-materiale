import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// Queste credenziali sono SEGRETE (a differenza di quelle in firebase.ts,
// che sono pubbliche) — vanno messe solo come variabili d'ambiente su
// Vercel, mai nel codice, e questo file viene eseguito solo lato server,
// mai nel browser.
const app = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        // Su Vercel gli "a capo" della chiave privata vanno scritti come
        // \n letterali nel valore della variabile d'ambiente: qui li
        // ripristiniamo in veri a capo.
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    })
  : getApps()[0]

export const adminDb = getFirestore(app)
export const adminMessaging = getMessaging(app)
