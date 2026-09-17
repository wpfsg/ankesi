import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Null when the environment has no Supabase credentials, and during the
 *  prerender: there is no session on the server, and pages must render the
 *  same markup there as in the browser's first paint. */
export const supabase: SupabaseClient | null =
  url && key && !import.meta.env.SSR
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
    : null

/** Env-based, so it agrees on the server and in the browser. */
export { hasBackend } from './backend'

export function photoUrl(path: string | null | undefined): string | null {
  if (!path || !supabase) return null
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
}
