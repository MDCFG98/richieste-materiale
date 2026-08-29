import { getMessagingInstance, db } from '@/lib/firebase'
import { getToken } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'

// Chiave pubblica generata su Firebase Console → Project Settings →
// Cloud Messaging → "Web Push certificates". Non è un segreto: va bene
// che sia visibile nel codice del sito.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''

export type NotificationStatus = 'non-supportate' | 'negato' | 'attivate' | 'errore'

// Chiede il permesso e, se accettato, salva il token del dispositivo sul
// profilo utente in Firestore — così il server sa dove mandare le notifiche
// future per quella persona.
export async function attivaNotifiche(uid: string): Promise<NotificationStatus> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'non-supportate'
    }

    const messaging = await getMessagingInstance()
    if (!messaging) return 'non-supportate'

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'negato'

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (!token) return 'errore'

    await updateDoc(doc(db, 'users', uid), { fcmToken: token })
    return 'attivate'
  } catch (e) {
    console.error('Errore attivazione notifiche:', e)
    return 'errore'
  }
}
