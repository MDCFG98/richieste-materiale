"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, X, Shield, HardHat, Warehouse } from 'lucide-react'

type UserRole = 'pending' | 'operaio' | 'magazzino' | 'admin'

interface AppUser {
  id: string
  name: string
  role: UserRole
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: typeof HardHat }> = {
  pending:   { label: 'In attesa',  color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: X },
  operaio:   { label: 'Operaio',    color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',       icon: HardHat },
  magazzino: { label: 'Magazzino',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',       icon: Warehouse },
  admin:     { label: 'Admin',      color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: Shield },
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AppUser[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'admin') { router.replace('/'); return }
  }, [user, router])

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser)))
    })
  }, [])

  const setRole = async (uid: string, role: UserRole) => {
    setUpdating(uid)
    await updateDoc(doc(db, 'users', uid), { role })
    setUpdating(null)
  }

  const pending = users.filter(u => u.role === 'pending')
  const approved = users.filter(u => u.role !== 'pending')

  if (!user || user.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-foreground font-bold text-sm">Gestione Utenti</p>
          <p className="text-eyebrow">Pannello Admin</p>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6">

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Da approvare ({pending.length})
            </h2>
            {pending.map(u => (
              <div key={u.id} className="myhra-card border-yellow-500/30 p-4 flex items-center justify-between gap-4">
                <p className="text-sm font-black text-foreground">{u.name}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRole(u.id, 'operaio')}
                    disabled={updating === u.id}
                    className="flex items-center gap-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40"
                  >
                    <HardHat className="h-3 w-3" />
                    Operaio
                  </button>
                  <button
                    onClick={() => setRole(u.id, 'magazzino')}
                    disabled={updating === u.id}
                    className="flex items-center gap-1.5 bg-secondary hover:bg-blue-500 hover:text-white text-foreground px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40"
                  >
                    <Warehouse className="h-3 w-3" />
                    Magazzino
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All approved users */}
        <div className="space-y-3">
          <h2 className="text-eyebrow">
            Utenti attivi ({approved.length})
          </h2>
          {approved.map(u => {
            const cfg = ROLE_CONFIG[u.role]
            return (
              <div key={u.id} className="myhra-card p-4 flex items-center justify-between gap-4">
                <p className="text-sm font-black text-foreground truncate min-w-0">{u.name}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {/* Quick role change - non mostrare per se stessi */}
                  {u.id !== user.uid && (
                    <select
                      value={u.role}
                      disabled={updating === u.id}
                      onChange={e => setRole(u.id, e.target.value as UserRole)}
                      className="bg-secondary border border-border text-foreground/80 text-[10px] rounded-lg px-2 py-1 focus:outline-none focus:border-primary uppercase font-bold"
                    >
                      <option value="operaio">Operaio</option>
                      <option value="magazzino">Magazzino</option>
                      <option value="admin">Admin</option>
                      <option value="pending">Sospendi</option>
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
