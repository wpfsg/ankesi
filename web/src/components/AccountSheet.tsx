import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { User } from '@supabase/supabase-js'
import type { Spot } from '../types'
import type { Lang } from '../i18n'
import { hasBackend } from '../lib/backend'
import { paths } from '../lib/routes'
import { initialOf } from '../lib/displayName'
import { signOut } from '../lib/useSession'
import { useProfile } from '../lib/useProfile'
import { EMAIL_CODE, useSignIn } from '../lib/useSignIn'
import { ModalSheet } from './ModalSheet'
import { Badge, Btn, CatchBody, CatchItem, Input, Label, Muted, Notice, SectionHeading } from '../styles/shared'
import { Divider, Identity, Initial } from './AccountSheet.styles'

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

/** The account in map context: signing in without leaving the map, and the
 *  actions that belong to the map. The profile itself lives on its own page
 *  (`/:lang/account`), which this links to rather than duplicating. */
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
  return <SignedIn {...props} user={props.user} />
}

function SignIn({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const { t } = useTranslation()
  const s = useSignIn(lang)

  return (
    <ModalSheet title={t('account.signIn')} onClose={onClose}>
      <Muted as="p" style={{ margin: 0 }}>
        {t('account.intro')} {t('account.signUpNote')}
      </Muted>
      {s.sent ? (
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
                  value={s.code}
                  onChange={(e) => s.setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void s.verify()}
                />
                <Muted style={{ marginTop: 6 }}>{t('account.codeHint')}</Muted>
              </div>
              <Btn type="button" $accent $block disabled={!s.canVerify} onClick={() => void s.verify()}>
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
              value={s.email}
              onChange={(e) => s.setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void s.sendLink()}
            />
          </div>
          <Btn type="button" $accent $block disabled={!s.canSend} onClick={() => void s.sendLink()}>
            {t('account.sendLink')}
          </Btn>
          <Divider>{t('account.or')}</Divider>
          <Btn type="button" $block disabled={s.busy} onClick={() => void s.google()}>
            {t('account.google')}
          </Btn>
        </>
      )}
      {s.error && <Notice $warn>{s.error}</Notice>}
    </ModalSheet>
  )
}

function SignedIn({ user, lang, savedSpots, onClose, onOpenCatches, onOpenPond, onSelectSpot, onUnsave }: Props & { user: User }) {
  const { t } = useTranslation()
  const { displayName } = useProfile(user)
  const name = displayName || t('profile.angler')

  return (
    <ModalSheet title={t('account.title')} onClose={onClose}>
      <Identity>
        <Initial aria-hidden="true">{initialOf(name)}</Initial>
        <CatchBody>
          {name}
          <small>{user.email}</small>
        </CatchBody>
      </Identity>

      <Btn as={Link} to={paths.account(lang)} $accent $block onClick={onClose}>
        {t('account.openProfile')}
      </Btn>
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
