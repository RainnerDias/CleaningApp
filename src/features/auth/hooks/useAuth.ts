'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Hook that manages Supabase authentication state.
 * Subscribes to auth state changes and exposes signIn / signOut helpers.
 */
export function useAuth() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Hydrate initial session
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    // Keep state in sync with Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  /**
   * Sign in with email and password.
   * Returns `{ error }` so the caller can handle the error message.
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  /**
   * Sign out the current user and redirect to /login.
   */
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return { user, loading, signIn, signOut }
}
