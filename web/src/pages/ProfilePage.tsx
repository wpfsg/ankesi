import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { User } from '@supabase/supabase-js'
import styled from 'styled-components'
import type { Catch, PondSubmission, SpeciesId, Spot } from '../types'
import type { Lang } from '../i18n'
import { SPOTS } from '../data/spots'
import { hasBackend } from '../lib/backend'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { fmtDay, fmtGel } from '../lib/format'
import { speciesName, spotName } from '../lib/spotInfo'
import { initialOf } from '../lib/displayName'
import { photoUrl } from '../lib/supabase'
import { signOut, useSession } from '../lib/useSession'
import { updateDisplayName, useProfile } from '../lib/useProfile'
import { EMAIL_CODE, useSignIn } from '../lib/useSignIn'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { Badge, Notice, liquidGlass, tabular } from '../styles/shared'
import {
  ButtonLink,
  Card,
  DESKTOP,
  Eyebrow,
  GhostLink,
  GlassInput,
  H1,
  H2,
  Lead,
  Muted,
  Page,
  PageHead,
  PrimaryButton,
  Prose,
  Section,
  Split,
  Sticky,
} from '../styles/page'

/* ---------------------------------------------------------------- styles */

const Hero = styled.div`
  ${liquidGlass}
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  ${DESKTOP} {
    padding: 26px 28px;
    gap: 20px;
  }
`

const Avatar = styled.span`
  flex: none;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 25px;
  font-weight: 700;
  color: var(--pri-fg);
  background: linear-gradient(140deg, var(--accent), var(--pri));
  box-shadow: var(--pri-shadow), var(--glass-highlight);

  ${DESKTOP} {
    width: 72px;
    height: 72px;
    font-size: 30px;
  }
`

const HeroBody = styled.div`
  flex: 1 1 220px;
  min-width: 0;
`

const HeroName = styled(H1)`
  font-size: clamp(22px, 3.4vw, 30px);
  overflow-wrap: anywhere;
`

const HeroMeta = styled.p`
  margin: 6px 0 0;
  font-size: 13.5px;
  color: var(--fg-3);
  overflow-wrap: anywhere;
`

const HeroActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

/** Small glass control used for secondary actions across the page. */
const Ghost = styled.button`
  ${liquidGlass}
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--fg);
  cursor: pointer;

  &:hover {
    background: var(--glass-bg-strong);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`

const NameForm = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;

  input {
    flex: 1 1 200px;
    min-width: 0;
  }
`

const Tiles = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  margin-top: 16px;
`

const Tile = styled.div`
  ${liquidGlass}
  border-radius: var(--radius-md);
  padding: 14px 16px;

  strong {
    ${tabular}
    display: block;
    font-size: 25px;
    font-weight: 700;
    line-height: 1.1;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 12.5px;
    color: var(--fg-3);
  }
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const Row = styled.li`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--glass-line);

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`

const RowBody = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 14.5px;
    font-weight: 650;
    line-height: 1.3;
  }

  small {
    display: block;
    margin-top: 2px;
    font-size: 12.5px;
    color: var(--fg-3);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`

/** Trailing controls on a row: stay on one line, never squeeze the body. */
const RowEnd = styled.div`
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
`

const Thumb = styled.img`
  flex: none;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: var(--glass-line);
`

const ThumbFallback = styled.span`
  flex: none;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  background: var(--glass-line);
  display: grid;
  place-items: center;
  color: var(--fg-3);
`

/** Delete / remove: quiet until hovered, and confirms in place. */
const Quiet = styled.button`
  flex: none;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--fg-3);
  cursor: pointer;

  &:hover {
    color: var(--band-dead);
    background: color-mix(in srgb, var(--band-dead) 12%, transparent);
  }

  &[data-confirm='true'] {
    color: var(--band-dead);
    background: color-mix(in srgb, var(--band-dead) 14%, transparent);
  }
`

const SignInCard = styled(Card)`
  max-width: 460px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--fg-3);
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--glass-line);
  }
`

const WhyGrid = styled.div`
  display: grid;
  gap: 14px;
  margin-top: 32px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
`

const Skeleton = styled.div<{ $h?: number }>`
  ${liquidGlass}
  border-radius: var(--radius-lg);
  height: ${(p) => p.$h ?? 96}px;
  opacity: 0.6;

  & + & {
    margin-top: 12px;
  }

  @media (prefers-reduced-motion: no-preference) {
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      opacity: 0.35;
    }
  }
`

/* ------------------------------------------------------------------ page */

/** The account's own page: sign in when signed out, and the full profile —
 *  identity, catch log, saved spots, pond submissions — when signed in.
 *  Private, so it is prerendered only as the shell and marked noindex. */
export function ProfilePage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { user, ready } = useSession()

  const crumbs = [{ name: t('nav.map'), to: paths.map(lang) }, { name: t('nav.account') }]

  return (
    <Page>
      <Head
        title={user ? t('nav.account') : t('profile.signIn.title')}
        description={t('profile.signIn.lead')}
        path={paths.account(lang)}
        lang={lang}
        noindex
      />
      <Breadcrumbs items={crumbs} />
      {!hasBackend ? (
        <Notice>{t('profile.noBackend')}</Notice>
      ) : !ready ? (
        <div aria-busy="true" aria-label={t('profile.loading')}>
          <Skeleton $h={120} />
          <Skeleton $h={72} />
        </div>
      ) : user ? (
        <SignedIn user={user} lang={lang} />
      ) : (
        <SignedOut lang={lang} />
      )}
    </Page>
  )
}

/* ------------------------------------------------------------- signed out */

function SignedOut({ lang }: { lang: Lang }) {
  const { t } = useTranslation()
  const s = useSignIn(lang)

  return (
    <>
      <PageHead>
        <Eyebrow>{t('profile.signIn.eyebrow')}</Eyebrow>
        <H1>{t('profile.signIn.title')}</H1>
        <Lead>{t('profile.signIn.lead')}</Lead>
      </PageHead>

      <SignInCard>
        {s.sent ? (
          <>
            <H2 style={{ fontSize: 18, margin: 0 }}>{t('profile.signIn.sentTitle')}</H2>
            <Prose>
              <p>{t('profile.signIn.sentBody', { email: s.email.trim() })}</p>
            </Prose>
            {EMAIL_CODE && (
              <>
                <label htmlFor="code">
                  <Muted as="span">{t('profile.signIn.code')}</Muted>
                </label>
                <GlassInput
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={s.code}
                  onChange={(e) => s.setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void s.verify()}
                />
                <Muted>{t('profile.signIn.codeHint')}</Muted>
                <PrimaryButton type="button" disabled={!s.canVerify} onClick={() => void s.verify()}>
                  {t('profile.signIn.verify')}
                </PrimaryButton>
              </>
            )}
            <Ghost type="button" onClick={s.reset}>
              {t('profile.signIn.another')}
            </Ghost>
          </>
        ) : (
          <>
            <label htmlFor="email">
              <Muted as="span">{t('profile.signIn.email')}</Muted>
            </label>
            <GlassInput
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={s.email}
              onChange={(e) => s.setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void s.sendLink()}
            />
            <PrimaryButton type="button" disabled={!s.canSend} onClick={() => void s.sendLink()}>
              {s.busy ? t('profile.signIn.sending') : t('profile.signIn.send')}
            </PrimaryButton>
            <Divider>{t('profile.signIn.or')}</Divider>
            <Ghost type="button" style={{ height: 46 }} disabled={s.busy} onClick={() => void s.google()}>
              {t('profile.signIn.google')}
            </Ghost>
            <Muted>{t('profile.signIn.noSignup')}</Muted>
          </>
        )}
        {s.error && <Notice $warn>{s.error}</Notice>}
      </SignInCard>

      <WhyGrid>
        {(['catches', 'reports', 'saved'] as const).map((k) => (
          <Card key={k}>
            <H2 style={{ fontSize: 16.5, marginBottom: 6 }}>{t(`profile.why.${k}.title`)}</H2>
            <Muted as="p">{t(`profile.why.${k}.body`)}</Muted>
          </Card>
        ))}
      </WhyGrid>
    </>
  )
}

/* -------------------------------------------------------------- signed in */

interface Loaded {
  catches: Catch[]
  saved: Spot[]
  ponds: PondSubmission[]
  reports: number
}

function SignedIn({ user, lang }: { user: User; lang: Lang }) {
  const { t } = useTranslation()
  const { displayName, ready: profileReady } = useProfile(user)
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const db = await import('../lib/db')
        const [catches, ids, ponds, stats] = await Promise.all([
          db.fetchMyCatches(user.id),
          db.fetchSavedSpotIds(user.id),
          db.fetchMyPonds(user.id),
          db.fetchMyStats(user.id),
        ])
        // Saved spots may include owner-submitted ponds, which are not in the
        // bundled list; fetch those only when an id is unaccounted for.
        const byId = new Map<string, Spot>(SPOTS.map((s) => [s.id, s]))
        if ([...ids].some((id) => !byId.has(id))) {
          for (const p of await db.fetchApprovedPonds().catch(() => [])) byId.set(p.id, p)
        }
        if (!alive) return
        const saved = [...ids].map((id) => byId.get(id)).filter((s): s is Spot => s !== undefined)
        setData({ catches, saved, ponds, reports: stats.reports })
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : t('common.error'))
      }
    })()
    return () => {
      alive = false
    }
  }, [user.id, t])

  const removeCatch = (id: string) => {
    setData((d) => (d ? { ...d, catches: d.catches.filter((c) => c.id !== id) } : d))
    void import('../lib/db').then((db) => db.deleteCatch(id).catch(() => setError(t('common.error'))))
  }

  const unsave = (id: string) => {
    setData((d) => (d ? { ...d, saved: d.saved.filter((s) => s.id !== id) } : d))
    void import('../lib/db').then((db) => db.setSaved(id, false, user.id).catch(() => setError(t('common.error'))))
  }

  const withdraw = (id: string) => {
    setData((d) => (d ? { ...d, ponds: d.ponds.filter((p) => p.id !== id) } : d))
    void import('../lib/db').then((db) => db.withdrawPond(id).catch(() => setError(t('common.error'))))
  }

  return (
    <>
      <Identity user={user} displayName={displayName} editable={profileReady} />

      <Tiles>
        <Tile>
          <strong>{data ? data.catches.length : '·'}</strong>
          <span>{t('profile.stats.catches')}</span>
        </Tile>
        <Tile>
          <strong>{data ? data.reports : '·'}</strong>
          <span>{t('profile.stats.reports')}</span>
        </Tile>
        <Tile>
          <strong>{data ? data.saved.length : '·'}</strong>
          <span>{t('profile.stats.saved')}</span>
        </Tile>
        {data && data.ponds.length > 0 && (
          <Tile>
            <strong>{data.ponds.length}</strong>
            <span>{t('profile.stats.ponds')}</span>
          </Tile>
        )}
      </Tiles>

      {error && (
        <Notice $warn style={{ marginTop: 16 }}>
          {error}
        </Notice>
      )}

      <Split style={{ marginTop: 36 }}>
        <div>
          <H2>{t('profile.catches.title')}</H2>
          {!data ? (
            <Skeleton $h={140} />
          ) : data.catches.length === 0 ? (
            <Card>
              <Prose>
                <p>
                  <strong>{t('profile.catches.empty')}</strong>
                </p>
                <p>{t('profile.catches.emptyCta')}</p>
              </Prose>
              <ButtonLink to={paths.map(lang)} style={{ marginTop: 14 }}>
                {t('profile.catches.toMap')}
              </ButtonLink>
            </Card>
          ) : (
            <Card>
              <List>
                {data.catches.map((c) => (
                  <CatchRow key={c.id} item={c} lang={lang} onDelete={() => removeCatch(c.id)} />
                ))}
              </List>
            </Card>
          )}
        </div>

        <Sticky>
          <Bests catches={data?.catches ?? []} lang={lang} />

          <Section style={{ marginTop: 24 }}>
            <H2 style={{ fontSize: 18 }}>{t('profile.saved.title')}</H2>
            <Card>
              {!data ? (
                <Muted>{t('profile.loading')}</Muted>
              ) : data.saved.length === 0 ? (
                <Muted>{t('profile.saved.empty')}</Muted>
              ) : (
                <List>
                  {data.saved.map((s) => (
                    <Row key={s.id}>
                      <RowBody>
                        <Link to={paths.spot(lang, s.id)}>
                          <strong>{spotName(s, lang)}</strong>
                        </Link>
                        <small>
                          {t(`type.${s.type}`)} · {t(`region.${s.region}`)}
                        </small>
                      </RowBody>
                      <Quiet type="button" onClick={() => unsave(s.id)}>
                        {t('profile.saved.remove')}
                      </Quiet>
                    </Row>
                  ))}
                </List>
              )}
            </Card>
          </Section>

          <Section style={{ marginTop: 24 }}>
            <H2 style={{ fontSize: 18 }}>{t('profile.ponds.title')}</H2>
            <Card>
              {data && data.ponds.length > 0 ? (
                <List>
                  {data.ponds.map((p) => (
                    <Row key={p.id}>
                      <RowBody>
                        <strong>{lang === 'ka' ? p.nameKa : p.nameEn}</strong>
                        <small>
                          {fmtDay(p.createdAt, t)}
                          {p.feeGel !== null ? ` · ${fmtGel(p.feeGel, lang)}` : ''}
                        </small>
                      </RowBody>
                      <RowEnd>
                        {p.approved ? (
                          <Badge $tone="accent">{t('profile.ponds.live')}</Badge>
                        ) : (
                          <>
                            <Badge>{t('profile.ponds.pending')}</Badge>
                            <Quiet type="button" onClick={() => withdraw(p.id)}>
                              {t('profile.ponds.withdraw')}
                            </Quiet>
                          </>
                        )}
                      </RowEnd>
                    </Row>
                  ))}
                </List>
              ) : (
                <Muted>{t('profile.ponds.hint')}</Muted>
              )}
              <GhostLink to={paths.mapAccount(lang)} style={{ marginTop: 14, width: '100%' }}>
                {t('profile.ponds.add')}
              </GhostLink>
            </Card>
          </Section>
        </Sticky>
      </Split>
    </>
  )
}

/** Avatar, display name with in-place editing, email and join date. */
function Identity({ user, displayName, editable }: { user: User; displayName: string; editable: boolean }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const name = displayName || t('profile.angler')
  const joined = user.created_at ? new Date(user.created_at) : null

  const open = () => {
    setDraft(displayName)
    setEditing(true)
    setError(null)
    window.setTimeout(() => input.current?.select(), 0)
  }

  const save = async () => {
    const next = draft.trim()
    if (!next || next === displayName) {
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      await updateDisplayName(user, next)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Hero>
        <Avatar aria-hidden="true">{initialOf(name)}</Avatar>
        <HeroBody>
          {editing ? (
            <>
              <label htmlFor="display-name">
                <Muted as="span">{t('profile.name')}</Muted>
              </label>
              <NameForm>
                <GlassInput
                  id="display-name"
                  ref={input}
                  maxLength={40}
                  autoComplete="nickname"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void save()
                    if (e.key === 'Escape') setEditing(false)
                  }}
                />
                <PrimaryButton type="button" disabled={busy} onClick={() => void save()}>
                  {busy ? t('profile.saving') : t('profile.save')}
                </PrimaryButton>
                <Ghost type="button" onClick={() => setEditing(false)}>
                  {t('profile.cancel')}
                </Ghost>
              </NameForm>
              <Muted style={{ marginTop: 6 }}>{t('profile.nameHint')}</Muted>
            </>
          ) : (
            <>
              <HeroName>{name}</HeroName>
              <HeroMeta>
                {user.email}
                {joined ? ` · ${t('profile.joined', { date: fmtDay(joined, t) })}` : ''}
              </HeroMeta>
            </>
          )}
        </HeroBody>
        {!editing && (
          <HeroActions>
            <Ghost type="button" disabled={!editable} onClick={open}>
              {t('profile.editName')}
            </Ghost>
            <Ghost type="button" onClick={() => void signOut()}>
              {t('profile.signOut')}
            </Ghost>
          </HeroActions>
        )}
      </Hero>
      {error && (
        <Notice $warn style={{ marginTop: 12 }}>
          {error}
        </Notice>
      )}
    </>
  )
}

function CatchRow({ item, lang, onDelete }: { item: Catch; lang: Lang; onDelete: () => void }) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState(false)
  const url = photoUrl(item.photoPath)
  const spot = SPOTS.find((s) => s.id === item.spotId)
  const size = [
    item.weightKg !== null ? `${item.weightKg} kg` : null,
    item.lengthCm !== null ? `${item.lengthCm} cm` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Row>
      {url ? <Thumb src={url} alt="" loading="lazy" /> : <ThumbFallback aria-hidden="true">🐟</ThumbFallback>}
      <RowBody>
        <strong>
          {speciesName(item.speciesId as SpeciesId, lang)}
          {size ? ` · ${size}` : ''}
          {item.isPublic && (
            <>
              {' '}
              <Badge>{t('profile.catches.public')}</Badge>
            </>
          )}
        </strong>
        <small>
          {spot ? <Link to={paths.spot(lang, spot.id)}>{spotName(spot, lang)}</Link> : item.spotId} ·{' '}
          {fmtDay(item.caughtAt, t)}
          {item.bait ? ` · ${item.bait}` : ''}
        </small>
      </RowBody>
      <Quiet
        type="button"
        data-confirm={confirm}
        onClick={() => (confirm ? onDelete() : setConfirm(true))}
        onBlur={() => setConfirm(false)}
      >
        {confirm ? t('profile.catches.confirm') : t('profile.catches.delete')}
      </Quiet>
    </Row>
  )
}

/** Personal records, computed from the catches already loaded. */
function Bests({ catches, lang }: { catches: Catch[]; lang: Lang }) {
  const { t } = useTranslation()

  const best = useMemo(() => {
    if (catches.length === 0) return null
    const heaviest = catches.reduce<Catch | null>((a, c) => (c.weightKg !== null && (!a || c.weightKg > (a.weightKg ?? 0)) ? c : a), null)
    const count = <T extends string>(key: (c: Catch) => T) => {
      const tally = new Map<T, number>()
      for (const c of catches) tally.set(key(c), (tally.get(key(c)) ?? 0) + 1)
      return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]
    }
    return { heaviest, species: count((c) => c.speciesId), spot: count((c) => c.spotId) }
  }, [catches])

  if (!best) return null
  const spot = SPOTS.find((s) => s.id === best.spot[0])

  return (
    <Card>
      <H2 style={{ fontSize: 16.5, marginBottom: 10 }}>{t('profile.bests.title')}</H2>
      <List>
        {best.heaviest?.weightKg != null && (
          <Row>
            <RowBody>
              <strong>
                {best.heaviest.weightKg} kg · {speciesName(best.heaviest.speciesId as SpeciesId, lang)}
              </strong>
              <small>{t('profile.bests.heaviest')}</small>
            </RowBody>
          </Row>
        )}
        <Row>
          <RowBody>
            <strong>
              {speciesName(best.species[0] as SpeciesId, lang)} · {t('profile.bests.times', { count: best.species[1] })}
            </strong>
            <small>{t('profile.bests.topSpecies')}</small>
          </RowBody>
        </Row>
        <Row>
          <RowBody>
            <strong>{spot ? spotName(spot, lang) : best.spot[0]}</strong>
            <small>{t('profile.bests.topSpot')}</small>
          </RowBody>
        </Row>
      </List>
    </Card>
  )
}
