import type { User } from '@supabase/supabase-js'

/** Name to show for a signed-in user: full name, else the email's local part. */
/** First letter for the avatar. Latin is capitalised; Georgian has no
 *  capitals, and toUpperCase() would turn Mkhedruli into Mtavruli. */
export function initialOf(name: string): string {
  const c = [...name.trim()][0] ?? '?'
  return /^[a-z]$/i.test(c) ? c.toUpperCase() : c
}

export function displayNameOf(user: User | null): string {
  if (!user) return ''
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const full = typeof meta?.full_name === 'string' ? meta.full_name : undefined
  return full || user.email?.split('@')[0] || ''
}
