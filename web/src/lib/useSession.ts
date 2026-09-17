import { useSyncExternalStore } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { hasBackend } from './backend'
import { langPath, type Lang } from '../i18n'

/**
 * The signed-in session, shared by every surface that asks for it: one
 * fetch and one auth subscription per page load. supabase-js is imported
 * on demand, so a visitor who never signs in never downloads it.
 */

interface State {
  session: Session | null
  ready: boolean
}

const EMPTY: State = { session: null, ready: !hasBackend }
let state = EMPTY
let started = false
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  for (const l of listeners) l()
}

async function client() {
  const { supabase } = await import('./supabase')
  return supabase
}

/** supabase-js persists the session under this key, derived from the project
 *  URL. Reading it costs nothing; constructing the auth client costs a
 *  request. */
function storedSession(): boolean {
  try {
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL as string).hostname.split('.')[0]
    return localStorage.getItem(`sb-${ref}-auth-token`) !== null
  } catch {
    // Storage blocked, or an unexpected URL: let the client decide.
    return true
  }
}

/** A sign-in redirect carries its token in the URL, and only the client can
 *  turn it into a session. */
const CALLBACK = /[#&?](access_token|code|error_description)=/

/** Anonymous visitors — most of the traffic on the content pages — never
 *  download the auth client. */
function needsClient(): boolean {
  return CALLBACK.test(window.location.hash) || CALLBACK.test(window.location.search) || storedSession()
}

/** Read the stored session and follow it from here on. Idempotent, so a
 *  sign-in that happens on a page which skipped the client can call it. */
let listening = false
async function listen(): Promise<void> {
  if (listening) return
  listening = true
  const sb = await client()
  if (!sb) {
    set({ session: null, ready: true })
    return
  }
  const { data } = await sb.auth.getSession()
  set({ session: data.session, ready: true })
  sb.auth.onAuthStateChange((_event, session) => set({ session, ready: true }))
}

function start() {
  if (started || !hasBackend || typeof window === 'undefined') return
  started = true
  if (!needsClient()) {
    set({ session: null, ready: true })
    return
  }
  void listen()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  start()
  return () => {
    listeners.delete(cb)
  }
}

export function useSession(): { session: Session | null; user: User | null; ready: boolean } {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  )
  return { session: s.session, user: s.session?.user ?? null, ready: s.ready }
}

/** Error text for the UI: a sentinel when the backend was unreachable, so
 *  the caller can show a localized message; otherwise Supabase's own text
 *  (rate limits, disabled provider), which is worth showing verbatim. */
function describe(error: AuthError): string {
  return error.status === 0 || error.name === 'AuthRetryableFetchError' ? 'network-error' : error.message
}

function redirectTo(lang: Lang): string {
  return `${window.location.origin}${langPath(lang)}`
}

export async function signInWithEmail(email: string, lang: Lang): Promise<string | null> {
  const sb = await client()
  if (!sb) return 'no-backend'
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo(lang) },
  })
  return error ? describe(error) : null
}

export async function signInWithGoogle(lang: Lang): Promise<string | null> {
  const sb = await client()
  if (!sb) return 'no-backend'
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo(lang) },
  })
  return error ? describe(error) : null
}

/** Second way in: the 6-digit code from the sign-in email, for mail apps
 *  that pre-open or break the link. */
export async function verifyEmailCode(email: string, code: string): Promise<string | null> {
  const sb = await client()
  if (!sb) return 'no-backend'
  const { data, error } = await sb.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
  if (error) return describe(error)
  // This page may have skipped the client entirely, so publish the session
  // ourselves and start following it.
  set({ session: data.session, ready: true })
  void listen()
  return null
}

export async function signOut(): Promise<void> {
  const sb = await client()
  await sb?.auth.signOut()
}

export { displayNameOf } from './displayName'
