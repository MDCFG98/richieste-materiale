"use client"
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Warehouse, Users, Download, FileText, Loader2, Search, Trash2, X } from 'lucide-react'

type Status = 'pending' | 'consegnato' | 'ordinato' | 'in_lavorazione' | 'non_approvato'
type FilterType = 'tutte' | Status

interface Richiesta {
  id: string
  text: string
  authorId: string
  authorName: string
  status: Status
  createdAt: Timestamp
}

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  pending:        { label: 'In attesa',      color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30' },
  consegnato:     { label: 'Consegnato',     color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  ordinato:       { label: 'Ordinato',       color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  in_lavorazione: { label: 'In lavorazione', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  non_approvato:  { label: 'Non approvata',  color: 'text-red-400 bg-red-400/10 border-red-400/30' },
}

const ACTION_BUTTONS: { status: Status; label: string; style: string }[] = [
  { status: 'consegnato',     label: 'Consegna Materiale',       style: 'bg-green-500 hover:bg-green-400 text-white' },
  { status: 'ordinato',       label: 'Materiale Ordinato',       style: 'bg-blue-500 hover:bg-blue-400 text-white' },
  { status: 'in_lavorazione', label: 'Materiale In Lavorazione', style: 'bg-yellow-500 hover:bg-yellow-400 text-black' },
  { status: 'non_approvato',  label: 'Richiesta Non Approvata',  style: 'bg-red-500 hover:bg-red-400 text-white' },
]

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'tutte',          label: 'Tutte' },
  { key: 'pending',        label: 'In attesa' },
  { key: 'consegnato',     label: 'Consegnato' },
  { key: 'ordinato',       label: 'Ordinato' },
  { key: 'in_lavorazione', label: 'In lavorazione' },
  { key: 'non_approvato',  label: 'Non approvate' },
]

// Etichetta leggibile per il raggruppamento per data (Oggi / Ieri / data completa)
function dateGroupLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return 'Oggi'
  if (d.getTime() === yesterday.getTime()) return 'Ieri'
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function MagazzinoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const [filter, setFilter] = useState<FilterType>('tutte')
  const [operaioFilter, setOperaioFilter] = useState<string>('tutti')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exportingHistory, setExportingHistory] = useState(false)
  const [exportingModulo, setExportingModulo] = useState<string | null>(null)

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

  const handleDelete = async (r: Richiesta) => {
    const ok = window.confirm(
      `Eliminare definitivamente la richiesta di ${r.authorName}?\n\n"${r.text.slice(0, 60)}${r.text.length > 60 ? '…' : ''}"\n\nQuesta azione non si può annullare.`
    )
    if (!ok) return
    setDeletingId(r.id)
    try {
      await deleteDoc(doc(db, 'richieste', r.id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportHistory = async () => {
    setExportingHistory(true)
    try {
      const { exportHistoryPDF } = await import('@/lib/pdf-export')
      await exportHistoryPDF(filtered)
    } finally {
      setExportingHistory(false)
    }
  }

  const handleExportModulo = async (r: Richiesta) => {
    setExportingModulo(r.id)
    try {
      const { exportModuloConsegnaPDF } = await import('@/lib/pdf-export')
      await exportModuloConsegnaPDF(r, STATUS_CONFIG[r.status].label)
    } finally {
      setExportingModulo(null)
    }
  }

  // Elenco operai unici, per il filtro "storico per operaio"
  const operai = useMemo(() => {
    const nomi = new Set(richieste.map(r => r.authorName).filter(Boolean))
    return Array.from(nomi).sort((a, b) => a.localeCompare(b))
  }, [richieste])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return richieste.filter(r => {
      if (filter !== 'tutte' && r.status !== filter) return false
      if (operaioFilter !== 'tutti' && r.authorName !== operaioFilter) return false
      if (s && !r.text.toLowerCase().includes(s) && !r.authorName?.toLowerCase().includes(s)) return false
      return true
    })
  }, [richieste, filter, operaioFilter, search])

  // Raggruppamento per data, mantenendo l'ordine già decrescente
  const grouped = useMemo(() => {
    const groups: { label: string; items: Richiesta[] }[] = []
    for (const r of filtered) {
      const date = r.createdAt?.toDate?.()
      const label = date ? dateGroupLabel(date) : 'Senza data'
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(r)
      else groups.push({ label, items: [r] })
    }
    return groups
  }, [filtered])

  const pendingCount = richieste.filter(r => r.status === 'pending').length
  const hasActiveFilters = filter !== 'tutte' || operaioFilter !== 'tutti' || search.trim() !== ''

  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Warehouse className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-foreground font-bold text-sm flex items-center gap-2">
              Richieste Materiale
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {pendingCount}
                </span>
              )}
            </p>
            <p className="text-eyebrow">{user.name} — Magazzino</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportHistory}
            disabled={exportingHistory || filtered.length === 0}
            className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/70 disabled:opacity-30 text-foreground/80 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-colors"
            title="Scarica storico in PDF"
          >
            {exportingHistory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Storico PDF</span>
          </button>
          {user.role === 'admin' && (
            <button onClick={() => router.push('/admin')}
              className="text-muted-foreground hover:text-foreground transition-colors" title="Gestione utenti">
              <Users className="h-4 w-4" />
            </button>
          )}
          <button onClick={async () => { await signOut(auth); router.replace('/login') }}
            className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-4">

        {/* Ricerca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per nome operaio o materiale..."
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-9 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro per operaio (storico per persona) */}
        {operai.length > 0 && (
          <select
            value={operaioFilter}
            onChange={e => setOperaioFilter(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            <option value="tutti">Tutti gli operai</option>
            {operai.map(nome => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        )}

        {/* Filtri di stato */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                filter === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[8px] rounded-full px-1">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => { setFilter('tutte'); setOperaioFilter('tutti'); setSearch('') }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Azzera filtri
          </button>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm">Nessuna richiesta</div>
        )}

        {/* Lista richieste, raggruppata per data */}
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.label} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-eyebrow capitalize">{group.label}</span>
                <div className="myhra-divider flex-1" />
              </div>

              {group.items.map(r => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                const date = r.createdAt?.toDate?.()
                const isUpdating = updatingId === r.id
                const isDeleting = deletingId === r.id
                const isExportingThis = exportingModulo === r.id

                return (
                  <div key={r.id}
                    className={`myhra-card p-5 space-y-4 transition-opacity ${
                      (isUpdating || isDeleting) ? 'opacity-40 pointer-events-none' : ''
                    } ${r.status === 'pending' ? 'border-yellow-500/30' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-[11px] font-black text-foreground/80 flex-shrink-0">
                          {r.authorName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-foreground uppercase tracking-wide truncate">{r.authorName}</p>
                          {date && (
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                              {date.toLocaleDateString('it-IT')} — {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(r)}
                            disabled={isDeleting}
                            title="Elimina definitivamente"
                            className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                          >
                            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/50 rounded-xl px-4 py-3 whitespace-pre-wrap">
                      {r.text}
                    </p>

                    {/* Pulsanti azione — 4 in griglia 2x2 su mobile, 4 in fila su desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ACTION_BUTTONS.map(btn => (
                        <button
                          key={btn.status}
                          onClick={() => updateStatus(r.id, btn.status)}
                          disabled={isUpdating || r.status === btn.status}
                          className={`py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all disabled:cursor-default leading-tight ${
                            r.status === btn.status
                              ? `${btn.style} ring-2 ring-white/30 opacity-100`
                              : `${btn.style} opacity-50 hover:opacity-100`
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Genera modulo di consegna PDF */}
                    <button
                      onClick={() => handleExportModulo(r)}
                      disabled={isExportingThis}
                      className="w-full flex items-center justify-center gap-2 border border-border hover:border-primary hover:text-primary text-muted-foreground text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-colors"
                    >
                      {isExportingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      Genera Modulo di Consegna PDF
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
