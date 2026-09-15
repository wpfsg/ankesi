import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Null when the environment has no Supabase credentials. The app keeps
 *  working read-only; account features show a "not configured" notice. */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null

export const hasBackend = supabase !== null

export function photoUrl(path: string | null | undefined): string | null {
  if (!path || !supabase) return null
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
}
