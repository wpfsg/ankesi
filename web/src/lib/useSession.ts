import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { hasBackend, supabase } from './supabase'
import type { Lang } from '../i18n'

export function useSession(): { session: Session | null; user: User | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!hasBackend)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, ready }
}

function redirectTo(lang: Lang): string {
  return `${window.location.origin}/${lang}`
}

export async function signInWithEmail(email: string, lang: Lang): Promise<string | null> {
  if (!supabase) return 'no-backend'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo(lang) },
  })
  return error ? error.message : null
}

export async function signInWithGoogle(lang: Lang): Promise<string | null> {
  if (!supabase) return 'no-backend'
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo(lang) },
  })
  return error ? error.message : null
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function displayNameOf(user: User | null): string {
  if (!user) return ''
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const full = typeof meta?.full_name === 'string' ? meta.full_name : undefined
  return full || user.email?.split('@')[0] || ''
}
