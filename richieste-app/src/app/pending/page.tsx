"use client"
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Clock, LogOut } from 'lucide-react'

export default function PendingPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
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
            Riceverai accesso non appena un amministratore approverà il tuo profilo.
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
