import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../services/backend'
export const AuthContext = createContext<{
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  error: string
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  error: '',
  refresh: async () => {},
  signOut: async () => {},
})
export const useAuth = () => useContext(AuthContext)
