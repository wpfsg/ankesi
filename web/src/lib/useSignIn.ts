import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../i18n'
import { signInWithEmail, signInWithGoogle, verifyEmailCode } from './useSession'

/** The 6-digit code only exists in the custom sign-in email, which needs
 *  your own SMTP (supabase/SETUP.md §4). Off until then. */
export const EMAIL_CODE = import.meta.env.VITE_AUTH_EMAIL_CODE === '1'

/**
 * Sign-in state and actions, shared by the account sheet on the map and the
 * profile page. Each surface renders it with its own primitives; nothing
 * here touches the DOM.
 */
export function useSignIn(lang: Lang) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 'network-error' is the sentinel from useSession: the backend could not be
  // reached, which is ours to phrase. Anything else is Supabase's own text.
  const show = (err: string, fallback = err) => setError(err === 'network-error' ? t('common.error') : fallback)

  const run = async (fn: () => Promise<string | null>, fallback?: string) => {
    setBusy(true)
    setError(null)
    const err = await fn()
    setBusy(false)
    if (err) show(err, fallback ?? err)
    return err
  }

  return {
    email,
    setEmail,
    code,
    setCode: (v: string) => setCode(v.replace(/\D/g, '')),
    busy,
    sent,
    error,
    canSend: email.trim().length > 3 && !busy,
    canVerify: code.length === 6 && !busy,
    sendLink: async () => {
      if (email.trim().length < 4) return
      const err = await run(() => signInWithEmail(email.trim(), lang))
      if (!err) setSent(true)
    },
    google: () => run(() => signInWithGoogle(lang)),
    verify: () => run(() => verifyEmailCode(email.trim(), code), t('account.codeInvalid')),
    /** Back to the address field, e.g. "use another email". */
    reset: () => {
      setSent(false)
      setCode('')
      setError(null)
    },
  }
}
