"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

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
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async (uid: string, email: string | null) => {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      const data = snap.data()
      setUser({ uid, email, name: data.name || email || '', role: data.role || 'pending' })
    } else {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    const current = auth.currentUser
    if (current) await loadUser(current.uid, current.email)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUser(firebaseUser.uid, firebaseUser.email)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
