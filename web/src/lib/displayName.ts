import type { User } from '@supabase/supabase-js'

/** Name to show for a signed-in user: full name, else the email's local part. */
export function displayNameOf(user: User | null): string {
  if (!user) return ''
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const full = typeof meta?.full_name === 'string' ? meta.full_name : undefined
  return full || user.email?.split('@')[0] || ''
}
