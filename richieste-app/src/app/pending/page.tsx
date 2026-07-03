"use client"
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Clock, LogOut, CheckCircle2 } from 'lucide-react'

export default function PendingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [justApproved, setJustApproved] = useState(false)

  // Grazie all'ascolto in tempo reale in AuthContext, non appena l'admin
  // approva l'utente questo effetto scatta automaticamente — nessun
  // refresh o nuovo login necessario.
  useEffect(() => {
    if (!user || user.role === 'pending') return

    setJustApproved(true)
    const destination = user.role === 'magazzino' || user.role === 'admin' ? '/magazzino' : '/operaio'
    const timer = setTimeout(() => router.replace(destination), 1200)
    return () => clearTimeout(timer)
  }, [user, router])

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  if (justApproved) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Sei stato approvato!</h1>
            <p className="text-zinc-500 text-sm mt-2">Ti stiamo reindirizzando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">In attesa di approvazione</h1>
          <p className="text-zinc-500 text-sm mt-2">
            La tua registrazione è in attesa di approvazione da parte del magazzino.
            Non appena verrai approvato, questa pagina si aggiornerà automaticamente.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mx-auto text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
        >
          <LogOut className="h-4 w-4" />
          Esci
        </button>
      </div>
    </div>
  )
}
