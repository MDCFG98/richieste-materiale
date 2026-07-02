"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Warehouse, Users, Clock, CheckCircle, Package, Wrench, Hammer, Shirt, HardHat } from 'lucide-react'

type Status = 'pending' | 'ordinato' | 'acquistato' | 'in_lavorazione'
type FilterType = 'tutte' | Status

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

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  pending:        { label: 'In attesa',      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  ordinato:       { label: 'Ordinato',       color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  acquistato:     { label: 'Acquistato',     color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  in_lavorazione: { label: 'In lavorazione', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
}

const ACTION_BUTTONS: { status: Status; label: string; style: string }[] = [
  { status: 'acquistato',    label: 'Acquistato',    style: 'bg-green-500 hover:bg-green-400 text-white' },
  { status: 'ordinato',      label: 'Ordinato',      style: 'bg-blue-500 hover:bg-blue-400 text-white' },
  { status: 'in_lavorazione',label: 'In Lavorazione',style: 'bg-orange-500 hover:bg-orange-400 text-white' },
]

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'tutte',        label: 'Tutte' },
  { key: 'pending',      label: 'In attesa' },
  { key: 'ordinato',     label: 'Ordinato' },
  { key: 'acquistato',   label: 'Acquistato' },
  { key: 'in_lavorazione', label: 'In lavorazione' },
]

export default function MagazzinoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const [filter, setFilter] = useState<FilterType>('tutte')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) router.replace('/login')
    else if (user.role === 'pending') router.replace('/pending')
    else if (user.role === 'operaio') router.replace('/operaio')
  }, [user, router])

  useEffect(() => {
    const q = query(collection(db, 'richieste'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setRichieste(snap.docs.map(d => ({ id: d.id, ...d.data() } as Richiesta)))
    })
  }, [])

  const updateStatus = async (id: string, status: Status) => {
    setUpdatingId(id)
    await updateDoc(doc(db, 'richieste', id), { status, updatedAt: new Date() })
    setUpdatingId(null)
  }

  const filtered = filter === 'tutte' ? richieste : richieste.filter(r => r.status === filter)
  const pendingCount = richieste.filter(r => r.status === 'pending').length

  if (!user) return null

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <Warehouse className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm flex items-center gap-2">
              Richieste Materiale
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {pendingCount}
                </span>
              )}
            </p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{user.name} — Magazzino</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button onClick={() => router.push('/admin')}
              className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Gestione utenti">
              <Users className="h-4 w-4" />
            </button>
          )}
          <button onClick={async () => { await signOut(auth); router.replace('/login') }}
            className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-4">

        {/* Filtri */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                filter === key ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
              {key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[8px] rounded-full px-1">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-700 text-sm">Nessuna richiesta</div>
        )}

        {/* Lista richieste */}
        <div className="space-y-4">
          {filtered.map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
            const date = r.createdAt?.toDate?.()
            const isUpdating = updatingId === r.id

            const voci = [
              r.materialeEdile && { label: 'Materiale Edile', text: r.materialeEdile, icon: Hammer,  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
              r.vestiario      && { label: 'Vestiario / DPI', text: r.vestiario,      icon: Shirt,   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
              r.attrezzi       && { label: 'Attrezzi',        text: r.attrezzi,       icon: HardHat, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
            ].filter(Boolean) as { label: string; text: string; icon: typeof Hammer; color: string; bg: string }[]

            return (
              <div key={r.id}
                className={`bg-zinc-900 border rounded-2xl p-5 space-y-4 transition-opacity ${
                  isUpdating ? 'opacity-40 pointer-events-none' : ''
                } ${r.status === 'pending' ? 'border-yellow-500/20' : 'border-zinc-800'}`}
              >
                {/* Autore + data + stato */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center text-[11px] font-black text-zinc-300 flex-shrink-0">
                      {r.authorName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wide">{r.authorName}</p>
                      {date && (
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
                          {date.toLocaleDateString('it-IT')} — {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Contenuto 3 sezioni */}
                <div className="space-y-2">
                  {voci.map(v => {
                    const VIcon = v.icon
                    return (
                      <div key={v.label} className={`border rounded-xl px-4 py-3 ${v.bg}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <VIcon className={`h-3 w-3 ${v.color}`} />
                          <p className={`text-[9px] font-black uppercase tracking-widest ${v.color}`}>{v.label}</p>
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed">{v.text}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Pulsanti azione */}
                <div className="grid grid-cols-3 gap-2">
                  {ACTION_BUTTONS.map(btn => (
                    <button
                      key={btn.status}
                      onClick={() => updateStatus(r.id, btn.status)}
                      disabled={isUpdating || r.status === btn.status}
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:cursor-default ${
                        r.status === btn.status
                          ? `${btn.style} ring-2 ring-white/20 opacity-100`
                          : `${btn.style} opacity-50 hover:opacity-100`
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
