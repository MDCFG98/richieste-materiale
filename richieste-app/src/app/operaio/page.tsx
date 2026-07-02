"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Send, LogOut, HardHat, Clock, CheckCircle, Package, Wrench, Loader2, HardHat as Helmet, Shirt, Hammer } from 'lucide-react'

type Status = 'pending' | 'ordinato' | 'acquistato' | 'in_lavorazione'

interface Richiesta {
  id: string
  materialeEdile: string
  vestiario: string
  attrezzi: string
  authorId: string
  authorName: string
  status: Status
  createdAt: Timestamp
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: typeof Clock }> = {
  pending:        { label: 'In attesa',      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: Clock },
  ordinato:       { label: 'Ordinato',       color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',      icon: Package },
  acquistato:     { label: 'Acquistato',     color: 'text-green-400 bg-green-400/10 border-green-400/30',   icon: CheckCircle },
  in_lavorazione: { label: 'In lavorazione', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30',icon: Wrench },
}

const SEZIONI = [
  { key: 'materialeEdile', label: 'Materiale Edile',    placeholder: 'es. Cemento 25kg x5, mattoni forati, rete elettrosaldata...', icon: Hammer,  color: 'border-orange-500/40 focus:border-orange-500' },
  { key: 'vestiario',      label: 'Vestiario / DPI',    placeholder: 'es. Guanti antitaglio taglia L x2, giacca alta visibilità M...', icon: Shirt,   color: 'border-blue-500/40 focus:border-blue-500' },
  { key: 'attrezzi',       label: 'Attrezzi da Lavoro', placeholder: 'es. Trapano a percussione, livella 60cm, chiavi a bussola...', icon: Helmet,  color: 'border-green-500/40 focus:border-green-500' },
] as const

export default function OperaioPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ materialeEdile: '', vestiario: '', attrezzi: '' })
  const [submitting, setSubmitting] = useState(false)
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!user) router.replace('/login')
    else if (user.role === 'pending') router.replace('/pending')
    else if (user.role === 'magazzino' || user.role === 'admin') router.replace('/magazzino')
  }, [user, router])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'richieste'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setRichieste(snap.docs.map(d => ({ id: d.id, ...d.data() } as Richiesta)))
    })
  }, [user])

  const isEmpty = !form.materialeEdile.trim() && !form.vestiario.trim() && !form.attrezzi.trim()

  const handleSubmit = async () => {
    if (isEmpty || !user) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'richieste'), {
        materialeEdile: form.materialeEdile.trim(),
        vestiario: form.vestiario.trim(),
        attrezzi: form.attrezzi.trim(),
        authorId: user.uid,
        authorName: user.name,
        status: 'pending',
        createdAt: serverTimestamp()
      })
      setForm({ materialeEdile: '', vestiario: '', attrezzi: '' })
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <HardHat className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm">{user.name}</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Richiesta Materiale</p>
          </div>
        </div>
        <button onClick={async () => { await signOut(auth); router.replace('/login') }}
          className="text-zinc-600 hover:text-zinc-300 transition-colors">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4 flex flex-col gap-6">

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-5">
          <div>
            <h2 className="text-base font-black text-white">Cosa ti serve?</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Compila solo le sezioni che ti interessano, poi invia.</p>
          </div>

          {SEZIONI.map(({ key, label, placeholder, icon: Icon, color }) => (
            <div key={key} className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </label>
              <textarea
                value={form[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={3}
                className={`w-full bg-zinc-800 border rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors resize-none ${color}`}
              />
            </div>
          ))}

          {/* Feedback invio */}
          {submitted && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-sm font-bold text-green-400">Richiesta inviata! Il magazzino la prenderà in carico.</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || isEmpty}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Invio in corso...' : 'Invia Richiesta'}
          </button>
        </div>

        {/* Storico */}
        {richieste.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 px-1">Le tue richieste precedenti</h3>
            {richieste.map(r => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
              const Icon = cfg.icon
              const date = r.createdAt?.toDate?.()
              const voci = [
                r.materialeEdile && { label: 'Materiale Edile', text: r.materialeEdile, color: 'text-orange-400' },
                r.vestiario      && { label: 'Vestiario',       text: r.vestiario,      color: 'text-blue-400' },
                r.attrezzi       && { label: 'Attrezzi',        text: r.attrezzi,       color: 'text-green-400' },
              ].filter(Boolean) as { label: string; text: string; color: string }[]

              return (
                <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {date && (
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                        {date.toLocaleDateString('it-IT')} — {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {voci.map(v => (
                      <div key={v.label}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${v.color}`}>{v.label}</p>
                        <p className="text-xs text-zinc-400">{v.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
