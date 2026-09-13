import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { AuthContext } from './context'
import { backendReady, errorMessage, supabase } from '../services/backend'
import type { Profile } from '../services/backend'
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [isAdmin, setIsAdmin] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('')
  const generation = useRef(0)
  const hydrate = useCallback(async (next: User | null) => {
    const current = ++generation.current
    setUser(next)
    setError('')
    if (!next) {
      setProfile(null)
      setIsAdmin(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const [p, a] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', next.id).single(),
      supabase.rpc('is_admin'),
    ])
    if (current !== generation.current) return
    if (p.error || a.error) {
      setError(errorMessage(p.error || a.error))
      setProfile(null)
      setIsAdmin(false)
    } else {
      setProfile(p.data)
      setIsAdmin(a.data === true)
    }
    setLoading(false)
  }, [])
  const cancelHydration = useCallback(() => {
    generation.current++
  }, [])
  useEffect(() => {
    if (!backendReady) {
      queueMicrotask(() => {
        setError('خدمة الحسابات غير مهيأة.')
        setLoading(false)
      })
      return
    }
    let alive = true
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return
      if (error) {
        setError(errorMessage(error))
        setLoading(false)
        return
      }
      void hydrate(data.session?.user || null)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (event === 'PASSWORD_RECOVERY') window.location.hash = '/auth/reset'
      if (event === 'TOKEN_REFRESHED') return
      setTimeout(() => {
        if (alive) void hydrate(session?.user || null)
      }, 0)
    })
    return () => {
      alive = false
      cancelHydration()
      subscription.unsubscribe()
    }
  }, [hydrate, cancelHydration])
  const refresh = async () => {
    const { data } = await supabase.auth.getSession()
    await hydrate(data.session?.user || null)
  }
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    await hydrate(null)
  }
  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, error, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
