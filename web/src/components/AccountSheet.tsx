import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import type { Spot } from '../types'
import type { Lang } from '../i18n'
import { hasBackend } from '../lib/supabase'
import { displayNameOf, signInWithEmail, signInWithGoogle, signOut } from '../lib/useSession'
import { ModalSheet } from './ModalSheet'
import { Badge, Btn, CatchBody, CatchItem, Input, Label, Muted, Notice, SectionHeading } from '../styles/shared'
import { Divider } from './AccountSheet.styles'

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
        <Notice>{t('account.noBackend')}</Notice>
      </ModalSheet>
    )
  }

  if (!user) {
    return (
      <ModalSheet title={t('account.signIn')} onClose={onClose}>
        <Muted as="p" style={{ margin: 0 }}>
          {t('account.intro')} {t('account.signUpNote')}
        </Muted>
        {sent ? (
          <Notice>{t('account.linkSent')}</Notice>
        ) : (
          <>
            <div>
              <Label htmlFor="email">{t('account.email')}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void sendLink()}
              />
            </div>
            <Btn type="button" $accent $block disabled={busy || !email.trim()} onClick={() => void sendLink()}>
              {t('account.sendLink')}
            </Btn>
            <Divider>{t('account.or')}</Divider>
            <Btn type="button" $block disabled={busy} onClick={() => void google()}>
              {t('account.google')}
            </Btn>
          </>
        )}
        {error && <Notice $warn>{error}</Notice>}
      </ModalSheet>
    )
  }

  return (
    <ModalSheet title={t('account.title')} onClose={onClose}>
      <Muted as="p" style={{ margin: 0 }}>
        {t('account.signedInAs', { name: displayNameOf(user) })}
      </Muted>
      <Btn type="button" $block onClick={onOpenCatches}>
        {t('account.myCatches')}
      </Btn>
      <Btn type="button" $block onClick={onOpenPond}>
        {t('account.submitPond')}
      </Btn>

      <SectionHeading style={{ marginTop: 8 }}>{t('account.savedSpots')}</SectionHeading>
      {savedSpots.length === 0 && <Muted>{t('account.noSaved')}</Muted>}
      {savedSpots.map((s) => (
        <CatchItem key={s.id}>
          <CatchBody as="button" type="button" style={{ textAlign: 'left' }} onClick={() => onSelectSpot(s.id)}>
            {lang === 'ka' ? s.nameKa : s.nameEn}
            <small>
              {t(`type.${s.type}`)} · {t(`region.${s.region}`)}
            </small>
          </CatchBody>
          <Badge as="button" type="button" onClick={() => onUnsave(s.id)}>
            {t('common.delete')}
          </Badge>
        </CatchItem>
      ))}

      <Btn type="button" $block style={{ marginTop: 8 }} onClick={() => void signOut().then(onClose)}>
        {t('account.signOut')}
      </Btn>
    </ModalSheet>
  )
}
