"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Loader2, HardHat } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) { setError('Compila tutti i campi'); return }
    if (isRegister && !name.trim()) { setError('Inserisci il tuo nome'); return }
    setLoading(true)
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: name.trim(),
          email,
          role: 'pending',
          createdAt: serverTimestamp()
        })
        router.replace('/pending')
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        router.replace('/')
      }
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': 'Utente non trovato',
        'auth/wrong-password': 'Password errata',
        'auth/email-already-in-use': 'Email già registrata',
        'auth/weak-password': 'Password troppo corta (min 6 caratteri)',
        'auth/invalid-email': 'Email non valida',
        'auth/invalid-credential': 'Credenziali non valide',
      }
      setError(msg[e.code] || 'Errore: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center mb-4 shadow-xl shadow-orange-500/20">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Richieste Materiale</h1>
          <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Construction & Drilling</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
            {isRegister ? 'Registrazione' : 'Accesso'}
          </h2>

          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Nome e Cognome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mario Rossi"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="mario@azienda.it"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-xs text-red-400 font-bold">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister ? 'Registrati' : 'Accedi'}
          </button>

          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
          >
            {isRegister ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>
      </div>
    </div>
  )
}
