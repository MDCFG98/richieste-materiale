"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

export type UserRole = 'pending' | 'operaio' | 'magazzino' | 'admin'

export interface AuthUser {
  uid: string
  email: string | null
  name: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Chiudi il listener precedente sul documento utente, se presente
      if (unsubUserDoc) {
        unsubUserDoc()
        unsubUserDoc = null
      }

      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      // Ascolto in tempo reale del documento utente: qualsiasi cambio di ruolo
      // (es. approvazione da parte dell'admin) si riflette istantaneamente
      // nell'app, senza bisogno di refresh o nuovo login.
      unsubUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: data.name || firebaseUser.email || '',
            role: data.role || 'pending',
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      })
    })

    return () => {
      unsubAuth()
      if (unsubUserDoc) unsubUserDoc()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
