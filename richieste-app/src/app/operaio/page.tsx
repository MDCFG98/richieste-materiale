"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Send, LogOut, HardHat, Warehouse, Check, CheckCheck } from 'lucide-react'

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
  pending:        { label: 'In attesa',            color: 'text-zinc-400',  bubbleColor: 'bg-zinc-800' },
  consegnato:     { label: 'Materiale consegnato', color: 'text-green-400', bubbleColor: 'bg-green-500/10 border border-green-500/30' },
  ordinato:       { label: 'Materiale ordinato',   color: 'text-blue-400',  bubbleColor: 'bg-blue-500/10 border border-blue-500/30' },
  in_lavorazione: { label: 'In lavorazione',       color: 'text-yellow-400',bubbleColor: 'bg-yellow-500/10 border border-yellow-500/30' },
  non_approvato:  { label: 'Non approvata',        color: 'text-red-400',  bubbleColor: 'bg-red-500/10 border border-red-500/30' },
}

const WELCOME_MESSAGE = "Ciao! Se hai bisogno di materiale chiedi pure, il magazzino riceverà in live qualsiasi tua richiesta. Scrivi liberamente, ti terremo aggiornato sull'esito della richiesta. Saluti dal magazzino."

export default function OperaioPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, snap => {
      setRichieste(snap.docs.map(d => ({ id: d.id, ...d.data() } as Richiesta)))
    })
  }, [user])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [richieste])

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
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header stile WhatsApp */}
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between bg-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Warehouse className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Magazzino</p>
            <p className="text-green-400 text-[11px]">● online</p>
          </div>
        </div>
        <button onClick={async () => { await signOut(auth); router.replace('/login') }}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-2">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

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
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow">
              <p className="text-sm text-zinc-100 leading-relaxed">{WELCOME_MESSAGE}</p>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1 ml-1">Magazzino</p>
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
                  <span className="bg-zinc-800/80 text-zinc-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {dateStr}
                  </span>
                </div>
              )}
              <div className="flex justify-end mb-1">
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <div className="bg-orange-500 rounded-2xl rounded-tr-sm px-4 py-3 shadow">
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{r.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      <span className="text-[10px] text-orange-100/80">{formatTime(r.createdAt)}</span>
                      {r.status === 'pending' ? (
                        <Check className="h-3.5 w-3.5 text-orange-100/60" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5 text-orange-100" />
                      )}
                    </div>
                  </div>
                  {/* Badge di stato sotto la bolla, come una risposta rapida del sistema */}
                  {r.status !== 'pending' && (
                    <div className="flex justify-end mt-1 mr-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${cfg.bubbleColor} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )}
                  {r.status === 'pending' && (
                    <p className="text-[10px] text-zinc-600 mt-1 mr-1 text-right">In attesa di risposta...</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input area stile WhatsApp */}
      <div className="border-t border-zinc-800 bg-zinc-900 px-3 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi cosa ti serve..."
            rows={1}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-3xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
