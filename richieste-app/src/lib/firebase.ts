import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "INSERISCI_QUI",
  authDomain: "INSERISCI_QUI",
  projectId: "INSERISCI_QUI",
  storageBucket: "INSERISCI_QUI",
  messagingSenderId: "INSERISCI_QUI",
  appId: "INSERISCI_QUI"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const db = getFirestore(app)
