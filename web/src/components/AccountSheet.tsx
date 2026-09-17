import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import type { PondSubmission, Spot } from '../types'
import type { Lang } from '../i18n'
import { hasBackend } from '../lib/supabase'
import { signInWithEmail, signInWithGoogle, signOut, verifyEmailCode } from '../lib/useSession'
import { updateDisplayName, useProfile } from '../lib/useProfile'
import { fetchMyPonds, fetchMyStats, withdrawPond, type MyStats } from '../lib/db'
import { fmtDay, fmtGel } from '../lib/format'
import { ModalSheet } from './ModalSheet'
import { Badge, Btn, CatchBody, CatchItem, Input, Label, Muted, Notice, SectionHeading } from '../styles/shared'
import { ChipRow, Divider, NameRow } from './AccountSheet.styles'

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

/** Account modal: sign-in when signed out, the profile when signed in. */
export function AccountSheet(props: Props) {
  const { t } = useTranslation()
  if (!hasBackend) {
    return (
      <ModalSheet title={t('account.title')} onClose={props.onClose}>
        <Notice>{t('account.noBackend')}</Notice>
      </ModalSheet>
    )
  }
  if (!props.user) return <SignIn lang={props.lang} onClose={props.onClose} />
  return <ProfileSheet {...props} user={props.user} />
}

/** The 6-digit code only exists in the custom sign-in email, which needs
 *  your own SMTP (supabase/SETUP.md §4). Off until then. */
const EMAIL_CODE = import.meta.env.VITE_AUTH_EMAIL_CODE === '1'

/** Magic link or Google. After the link is sent, the 6-digit code from the
 *  same email works too when EMAIL_CODE is on; the session change closes
 *  the loop either way. */
function SignIn({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const show = (err: string, fallback = err) => setError(err === 'network-error' ? t('common.error') : fallback)

  const sendLink = async () => {
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    const err = await signInWithEmail(email.trim(), lang)
    setBusy(false)
    if (err) show(err)
    else setSent(true)
  }

  const google = async () => {
    setBusy(true)
    setError(null)
    const err = await signInWithGoogle(lang)
    setBusy(false)
    if (err) show(err)
  }

  const verify = async () => {
    if (code.length !== 6) return
    setBusy(true)
    setError(null)
    const err = await verifyEmailCode(email.trim(), code)
    setBusy(false)
    if (err) show(err, t('account.codeInvalid'))
  }

  return (
    <ModalSheet title={t('account.signIn')} onClose={onClose}>
      <Muted as="p" style={{ margin: 0 }}>
        {t('account.intro')} {t('account.signUpNote')}
      </Muted>
      {sent ? (
        <>
          <Notice>{t('account.linkSent')}</Notice>
          {EMAIL_CODE && (
            <>
              <div>
                <Label htmlFor="otp">{t('account.code')}</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && void verify()}
                />
                <Muted style={{ marginTop: 6 }}>{t('account.codeHint')}</Muted>
              </div>
              <Btn type="button" $accent $block disabled={busy || code.length !== 6} onClick={() => void verify()}>
                {t('account.verify')}
              </Btn>
            </>
          )}
        </>
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

/** Profile: editable display name, membership facts, activity counts, pond
 *  submissions with their moderation state, saved spots, sign-out. */
function ProfileSheet({ user, lang, savedSpots, onClose, onOpenCatches, onOpenPond, onSelectSpot, onUnsave }: Props & { user: User }) {
  const { t } = useTranslation()
  const { profile, displayName, ready } = useProfile(user)
  // null = untouched: the field mirrors the saved name until the user types.
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [stats, setStats] = useState<MyStats | null>(null)
  const [ponds, setPonds] = useState<PondSubmission[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchMyStats(user.id)
      .then((s) => alive && setStats(s))
      .catch(() => undefined)
    fetchMyPonds(user.id)
      .then((p) => alive && setPonds(p))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [user.id])

  const name = draft ?? displayName
  const dirty = draft !== null && draft.trim().length > 0 && draft.trim() !== displayName

  const save = async () => {
    if (!dirty || saving) return
    setSaving(true)
    setError(null)
    try {
      await updateDisplayName(user, name)
      setDraft(null)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const withdraw = (id: string) => {
    setPonds((list) => list.filter((p) => p.id !== id))
    withdrawPond(id).catch(() => setError(t('common.error')))
  }

  const joined = profile?.createdAt ?? (user.created_at ? new Date(user.created_at) : null)

  return (
    <ModalSheet title={t('account.title')} onClose={onClose}>
      <SectionHeading style={{ marginTop: 0 }}>{t('account.profile')}</SectionHeading>
      <div>
        <Label htmlFor="display-name">{t('account.displayName')}</Label>
        <NameRow>
          <Input
            id="display-name"
            maxLength={40}
            autoComplete="nickname"
            value={name}
            disabled={!ready}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
          />
          <Btn type="button" $accent disabled={!dirty || saving} onClick={() => void save()}>
            {t('account.saveName')}
          </Btn>
        </NameRow>
        <Muted style={{ marginTop: 6 }}>
          {user.email}
          {joined ? ` · ${t('account.memberSince', { date: fmtDay(joined, lang) })}` : ''}
        </Muted>
        {stats && <Muted>{t('account.stats', { catches: stats.catches, reports: stats.reports })}</Muted>}
        {savedFlash && <Notice style={{ marginTop: 8 }}>{t('account.nameSaved')}</Notice>}
      </div>

      <Btn type="button" $block onClick={onOpenCatches}>
        {t('account.myCatches')}
      </Btn>
      <Btn type="button" $block onClick={onOpenPond}>
        {t('account.submitPond')}
      </Btn>

      {ponds.length > 0 && (
        <>
          <SectionHeading>{t('account.myPonds')}</SectionHeading>
          {ponds.map((p) => (
            <CatchItem key={p.id}>
              <CatchBody>
                {lang === 'ka' ? p.nameKa : p.nameEn}
                <small>
                  {fmtDay(p.createdAt, lang)}
                  {p.feeGel !== null ? ` · ${fmtGel(p.feeGel, lang)}` : ''}
                </small>
              </CatchBody>
              <ChipRow>
                {p.approved ? (
                  <Badge $tone="accent">{t('account.pondLive')}</Badge>
                ) : (
                  <>
                    <Badge>{t('account.pondPending')}</Badge>
                    <Badge as="button" type="button" onClick={() => withdraw(p.id)}>
                      {t('account.withdraw')}
                    </Badge>
                  </>
                )}
              </ChipRow>
            </CatchItem>
          ))}
        </>
      )}

      <SectionHeading>{t('account.savedSpots')}</SectionHeading>
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

      {error && <Notice $warn>{error}</Notice>}

      <Btn type="button" $block style={{ marginTop: 8 }} onClick={() => void signOut().then(onClose)}>
        {t('account.signOut')}
      </Btn>
    </ModalSheet>
  )
}
