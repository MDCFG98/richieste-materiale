"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (user.role === 'pending') { router.replace('/pending'); return }
    if (user.role === 'magazzino' || user.role === 'admin') { router.replace('/magazzino'); return }
    router.replace('/operaio')
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
    </div>
  )
}
