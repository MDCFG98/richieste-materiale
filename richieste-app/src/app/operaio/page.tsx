"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Send, LogOut, Warehouse, Check, CheckCheck, Bell, X } from 'lucide-react'
import { attivaNotifiche } from '@/lib/notifications'

type Status = 'pending' | 'consegnato' | 'ordinato' | 'in_lavorazione' | 'non_approvato'

interface Richiesta {
  id: string
  text: string
  authorId: string
  authorName: string
  status: Status
  createdAt: Timestamp
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bubbleColor: string }> = {
  pending:        { label: 'In attesa',            color: 'text-zinc-400',  bubbleColor: 'bg-secondary' },
  consegnato:     { label: 'Materiale consegnato', color: 'text-green-400', bubbleColor: 'bg-green-500/10 border border-green-500/30' },
  ordinato:       { label: 'Materiale ordinato',   color: 'text-blue-400',  bubbleColor: 'bg-blue-500/10 border border-blue-500/30' },
  in_lavorazione: { label: 'In lavorazione',       color: 'text-yellow-400',bubbleColor: 'bg-yellow-500/10 border border-yellow-500/30' },
  non_approvato:  { label: 'Non approvata',        color: 'text-red-400',  bubbleColor: 'bg-red-500/10 border border-red-500/30' },
}

const WELCOME_MESSAGE = "Ciao! Se hai bisogno di materiale chiedi pure, il magazzino riceverà in live qualsiasi tua richiesta. Scrivi liberamente, ti terremo aggiornato sull'esito della richiesta. Saluti dal magazzino."

// Risposta automatica mostrata subito dopo l'invio, finché il magazzino non aggiorna davvero lo stato
const AUTO_REPLY = "Il magazzino ha preso in carico la tua richiesta. Controlla più tardi per verificarne lo stato."

export default function OperaioPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const [activatingNotif, setActivatingNotif] = useState(false)

  useEffect(() => {
    if (!user) router.replace('/login')
    else if (user.role === 'pending') router.replace('/pending')
    else if (user.role === 'magazzino' || user.role === 'admin') router.replace('/magazzino')
  }, [user, router])

  useEffect(() => {
    if (!user) return
    // Nota: niente orderBy qui apposta — un where + orderBy insieme richiede
    // un indice composto su Firestore che va creato a mano nella console.
    // Ordiniamo lato client per evitare quel passaggio manuale.
    const q = query(collection(db, 'richieste'), where('authorId', '==', user.uid))
    return onSnapshot(
      q,
      snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Richiesta))
        items.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
        setRichieste(items)
      },
      err => console.error('Errore caricamento richieste:', err)
    )
  }, [user])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [richieste])

  // Se il browser supporta le notifiche e non è mai stato chiesto il
  // permesso (né accettato né rifiutato), mostriamo il banner per attivarle.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setShowNotifBanner(true)
    }
  }, [])

  const handleAttivaNotifiche = async () => {
    if (!user) return
    setActivatingNotif(true)
    const esito = await attivaNotifiche(user.uid)
    setActivatingNotif(false)
    setShowNotifBanner(false)
    if (esito === 'negato') {
      window.alert('Hai rifiutato le notifiche. Se cambi idea, puoi attivarle dalle impostazioni del browser.')
    } else if (esito === 'errore' || esito === 'non-supportate') {
      window.alert('Non sono riuscito ad attivare le notifiche su questo dispositivo.')
    }
  }

  const handleSubmit = async () => {
    if (!text.trim() || !user) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'richieste'), {
        text: text.trim(),
        authorId: user.uid,
        authorName: user.name,
        status: 'pending',
        createdAt: serverTimestamp()
      })
      setText('')
      textareaRef.current?.focus()
    } catch (e: any) {
      window.alert('Non sono riuscito a inviare la richiesta.\n\n' + (e?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatTime = (ts?: Timestamp) => {
    const d = ts?.toDate?.()
    if (!d) return ''
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateDivider = (ts?: Timestamp) => {
    const d = ts?.toDate?.()
    if (!d) return ''
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) return 'Oggi'
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  }

  if (!user) return null

  // Group by date for dividers
  let lastDate = ''

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header stile WhatsApp */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Warehouse className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-foreground font-bold text-sm">Magazzino</p>
            <p className="text-green-400 text-[11px]">● online</p>
          </div>
        </div>
        <button onClick={async () => { await signOut(auth); router.replace('/login') }}
          className="text-muted-foreground hover:text-foreground transition-colors p-2">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {showNotifBanner && (
        <div className="bg-primary/10 border-b border-primary/30 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <Bell className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-foreground/90 flex-1">
            Vuoi ricevere una notifica sul telefono quando il magazzino aggiorna una tua richiesta?
          </p>
          <button
            onClick={handleAttivaNotifiche}
            disabled={activatingNotif}
            className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex-shrink-0 disabled:opacity-50"
          >
            {activatingNotif ? '...' : 'Attiva'}
          </button>
          <button onClick={() => setShowNotifBanner(false)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Area chat */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Messaggio di benvenuto - bolla ricevuta */}
        <div className="flex justify-start mb-4">
          <div className="max-w-[85%] sm:max-w-[70%]">
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 shadow">
              <p className="text-sm text-foreground/90 leading-relaxed">{WELCOME_MESSAGE}</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 ml-1">Magazzino</p>
          </div>
        </div>

        {/* Messaggi/richieste dell'operaio */}
        {richieste.map((r) => {
          const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
          const dateStr = formatDateDivider(r.createdAt)
          const showDivider = dateStr !== lastDate
          lastDate = dateStr

          return (
            <div key={r.id}>
              {showDivider && (
                <div className="flex justify-center my-4">
                  <span className="bg-secondary/80 text-muted-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {dateStr}
                  </span>
                </div>
              )}

              {/* Bolla inviata dall'operaio */}
              <div className="flex justify-end mb-1">
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3 shadow">
                    <p className="text-sm text-primary-foreground leading-relaxed whitespace-pre-wrap">{r.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      <span className="text-[10px] text-primary-foreground/70">{formatTime(r.createdAt)}</span>
                      {r.status === 'pending' ? (
                        <Check className="h-3.5 w-3.5 text-primary-foreground/60" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {r.status === 'pending' ? (
                /* Risposta automatica simulata, finché il magazzino non aggiorna davvero */
                <div className="flex justify-start mb-4 mt-1">
                  <div className="max-w-[85%] sm:max-w-[70%]">
                    <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 shadow">
                      <p className="text-sm text-foreground/80 leading-relaxed">{AUTO_REPLY}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-1">Magazzino</p>
                  </div>
                </div>
              ) : (
                /* Aggiornamento di stato reale, arrivato dal magazzino */
                <div className="flex justify-start mb-4 mt-1">
                  <div className="max-w-[85%] sm:max-w-[70%]">
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow ${cfg.bubbleColor}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-sm text-foreground/90 leading-relaxed">Aggiornamento sulla tua richiesta di materiale.</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-1">Magazzino</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Input area stile WhatsApp */}
      <div className="border-t border-border bg-card px-3 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi cosa ti serve..."
            rows={1}
            className="flex-1 bg-secondary border border-border rounded-3xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed text-primary-foreground flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
