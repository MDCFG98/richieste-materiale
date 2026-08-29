import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminMessaging } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { uid, title, body } = await req.json()
    if (!uid || !title || !body) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
    }

    const userSnap = await adminDb.collection('users').doc(uid).get()
    const token = userSnap.data()?.fcmToken
    if (!token) {
      // Normale se quella persona non ha ancora attivato le notifiche:
      // non è un errore, semplicemente non le mandiamo nulla.
      return NextResponse.json({ sent: false, reason: 'Nessun token salvato per questo utente' })
    }

    await adminMessaging.send({
      token,
      notification: { title, body },
      webpush: {
        fcmOptions: { link: '/' },
      },
    })

    return NextResponse.json({ sent: true })
  } catch (e: any) {
    console.error('Errore invio notifica:', e)
    return NextResponse.json({ error: e.message || 'Errore sconosciuto' }, { status: 500 })
  }
}
