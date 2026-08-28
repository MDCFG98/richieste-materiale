"use client"
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { signInAnonymously } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { Loader2, HardHat, ArrowRight, ArrowLeft } from 'lucide-react'

// Il codice aziendale è unico per tutti e fisso: si imposta come variabile
// d'ambiente su Vercel (NEXT_PUBLIC_CODICE_ACCESSO). Serve solo a tenere
// fuori chi non c'entra, non a distinguere le persone.
const CODICE_ACCESSO = process.env.NEXT_PUBLIC_CODICE_ACCESSO || ''

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'codice' | 'nome'>('codice')
  const [codice, setCodice] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleCodiceSubmit = () => {
    setError('')
    if (!codice.trim()) { setError('Inserisci il codice') ; return }
    if (codice.trim() !== CODICE_ACCESSO) {
      setError('Codice sbagliato, riprova')
      return
    }
    setStep('nome')
    setTimeout(() => nameInputRef.current?.focus(), 100)
  }

  const handleNomeSubmit = async () => {
    setError('')
    if (!name.trim()) { setError('Inserisci nome e cognome'); return }
    setLoading(true)
    try {
      const nameKey = name.trim().toLowerCase()
      const cred = await signInAnonymously(auth)

      // Se questo nome è già registrato e approvato (es. il dispositivo ha
      // perso la sessione, o sta accedendo da un altro telefono/PC), lo
      // riconosciamo e lo facciamo entrare subito con lo stesso ruolo,
      // senza richiedere una nuova approvazione da parte del magazzino.
      const q = query(collection(db, 'users'), where('nameKey', '==', nameKey))
      const snap = await getDocs(q)
      const giaApprovato = snap.docs
        .map(d => d.data())
        .find(u => u.role && u.role !== 'pending')

      const role = giaApprovato ? giaApprovato.role : 'pending'

      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name.trim(),
        nameKey,
        role,
        createdAt: serverTimestamp()
      })

      if (role === 'pending') router.replace('/pending')
      else if (role === 'magazzino' || role === 'admin') router.replace('/magazzino')
      else router.replace('/operaio')
    } catch (e: any) {
      setError('Errore, riprova: ' + e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
            <HardHat className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif-myhra text-3xl text-foreground">Richieste Materiale</h1>
          <p className="text-eyebrow mt-2">Construction & Drilling</p>
        </div>

        {/* Card */}
        <div className="myhra-card p-6 space-y-5">
          {step === 'codice' ? (
            <>
              <h2 className="text-eyebrow">Codice Azienda</h2>
              <p className="text-base text-foreground/80">
                Inserisci il codice che ti ha dato l'ufficio.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={codice}
                onChange={e => setCodice(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCodiceSubmit()}
                placeholder="Codice"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-4 text-2xl text-center tracking-widest text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                  <p className="text-sm text-destructive font-bold">{error}</p>
                </div>
              )}

              <button
                onClick={handleCodiceSubmit}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
              >
                Avanti
                <ArrowRight className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('codice'); setError('') }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Indietro
              </button>

              <h2 className="text-eyebrow">Il tuo nome</h2>
              <p className="text-base text-foreground/80">
                Come ti chiami? Scrivilo una volta sola, poi non serve più.
              </p>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNomeSubmit()}
                placeholder="Mario Rossi"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-4 text-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                  <p className="text-sm text-destructive font-bold">{error}</p>
                </div>
              )}

              <button
                onClick={handleNomeSubmit}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                Entra
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
