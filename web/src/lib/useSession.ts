import { useEffect, useState } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { hasBackend, supabase } from './supabase'
import { langPath, type Lang } from '../i18n'

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

/** Error text for the sheet: a sentinel when the backend was unreachable,
 *  so the UI can show a localized message; otherwise Supabase's own text
 *  (rate limits, disabled provider), which is worth showing verbatim. */
function describe(error: AuthError): string {
  return error.status === 0 || error.name === 'AuthRetryableFetchError' ? 'network-error' : error.message
}

function redirectTo(lang: Lang): string {
  return `${window.location.origin}${langPath(lang)}`
}

export async function signInWithEmail(email: string, lang: Lang): Promise<string | null> {
  if (!supabase) return 'no-backend'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo(lang) },
  })
  return error ? describe(error) : null
}

export async function signInWithGoogle(lang: Lang): Promise<string | null> {
  if (!supabase) return 'no-backend'
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo(lang) },
  })
  return error ? describe(error) : null
}

/** Second way in: the 6-digit code from the sign-in email, for mail apps
 *  that pre-open or break the link. */
export async function verifyEmailCode(email: string, code: string): Promise<string | null> {
  if (!supabase) return 'no-backend'
  const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
  return error ? describe(error) : null
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

export { displayNameOf } from './displayName'
