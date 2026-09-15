import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import type { Spot } from '../types'
import type { Lang } from '../i18n'
import { hasBackend } from '../lib/supabase'
import { displayNameOf, signInWithEmail, signInWithGoogle, signOut } from '../lib/useSession'
import { ModalSheet } from './ModalSheet'

interface Props {
  user: User | null
  lang: Lang
  savedSpots: Spot[]
  onClose: () => void
  onOpenCatches: () => void
  onOpenPond: () => void
  onSelectSpot: (id: string) => void
  onUnsave: (id: string) => void
}

export function AccountSheet({ user, lang, savedSpots, onClose, onOpenCatches, onOpenPond, onSelectSpot, onUnsave }: Props) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendLink = async () => {
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    const err = await signInWithEmail(email.trim(), lang)
    setBusy(false)
    if (err) setError(err)
    else setSent(true)
  }

  const google = async () => {
    setBusy(true)
    setError(null)
    const err = await signInWithGoogle(lang)
    setBusy(false)
    if (err) setError(err)
  }

  if (!hasBackend) {
    return (
      <ModalSheet title={t('account.title')} onClose={onClose}>
        <div className="notice">{t('account.noBackend')}</div>
      </ModalSheet>
    )
  }

  if (!user) {
    return (
      <ModalSheet title={t('account.signIn')} onClose={onClose}>
        <p className="muted" style={{ margin: 0 }}>
          {t('account.intro')} {t('account.signUpNote')}
        </p>
        {sent ? (
          <div className="notice">{t('account.linkSent')}</div>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="email">
                {t('account.email')}
              </label>
              <input
                id="email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void sendLink()}
              />
            </div>
            <button type="button" className="btn accent block" disabled={busy || !email.trim()} onClick={() => void sendLink()}>
              {t('account.sendLink')}
            </button>
            <div className="divider">{t('account.or')}</div>
            <button type="button" className="btn block" disabled={busy} onClick={() => void google()}>
              {t('account.google')}
            </button>
          </>
        )}
        {error && <div className="notice warn">{error}</div>}
      </ModalSheet>
    )
  }

  return (
    <ModalSheet title={t('account.title')} onClose={onClose}>
      <p className="muted" style={{ margin: 0 }}>
        {t('account.signedInAs', { name: displayNameOf(user) })}
      </p>
      <button type="button" className="btn block" onClick={onOpenCatches}>
        {t('account.myCatches')}
      </button>
      <button type="button" className="btn block" onClick={onOpenPond}>
        {t('account.submitPond')}
      </button>

      <div className="h" style={{ marginTop: 8 }}>
        {t('account.savedSpots')}
      </div>
      {savedSpots.length === 0 && <div className="muted">{t('account.noSaved')}</div>}
      {savedSpots.map((s) => (
        <div key={s.id} className="catch-item">
          <button type="button" className="catch-body" style={{ textAlign: 'left' }} onClick={() => onSelectSpot(s.id)}>
            {lang === 'ka' ? s.nameKa : s.nameEn}
            <small>
              {t(`type.${s.type}`)} · {t(`region.${s.region}`)}
            </small>
          </button>
          <button type="button" className="badge" onClick={() => onUnsave(s.id)}>
            {t('common.delete')}
          </button>
        </div>
      ))}

      <button type="button" className="btn block" style={{ marginTop: 8 }} onClick={() => void signOut().then(onClose)}>
        {t('account.signOut')}
      </button>
    </ModalSheet>
  )
}
