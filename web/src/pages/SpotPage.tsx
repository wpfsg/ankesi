import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import styled from 'styled-components'
import type { Report } from '../types'
import { SPOTS } from '../data/spots'
import { SPECIES } from '../data/species'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { absoluteUrl } from '../lib/site'
import { breadcrumbList, spotPlace } from '../lib/seo'
import { emptyView, useSnapshot, viewFromResult, viewFromSnapshot } from '../lib/snapshot'
import { useLiveScores } from '../lib/useLiveScores'
import { useReports } from '../lib/useReports'
import { applyCommunity, MODEL_VERSION } from '../lib/scoring'
import { estimateDriveMinutes, fmtTime, haversineKm, timeAgo } from '../lib/format'
import { TBILISI } from '../lib/origin'
import { bestTimeOfDay, nearbySpots, seasonLabel, speciesName, speciesSorted, spotName } from '../lib/spotInfo'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { ScoreHero } from '../components/score/ScoreHero'
import { BestWindowCard } from '../components/score/BestWindowCard'
import { FactorImpacts } from '../components/score/FactorImpacts'
import { ScoreStrip } from '../components/ScoreStrip'
import { FactorList } from '../components/FactorList'
import { StaticMap } from '../components/StaticMap'
import { SpotCard } from '../components/SpotCard'
import { NotFoundPage } from './NotFoundPage'
import { MiniBubble } from '../styles/shared'
import {
  ButtonLink,
  ButtonRow,
  Card,
  CardGrid,
  Eyebrow,
  Facts,
  Gate,
  GhostA,
  GlassInput,
  H1,
  H2,
  H3,
  Lead,
  Muted,
  Page,
  PageHead,
  PillLink,
  PrimaryButton,
  Prose,
  Section,
  Split,
  Sticky,
  TextLink,
} from '../styles/page'

const ACTIVITY_BAND: Record<number, string> = { [-2]: 'dead', [-1]: 'slow', 0: 'ok', 1: 'good', 2: 'great' }

const Hero = styled(Card)`
  padding: 20px;
`

const Details = styled.details`
  margin-top: 14px;
  border-top: 1px solid var(--brd);
  padding-top: 12px;

  summary {
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    color: var(--accent);
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }
`

const GateBox = styled(Gate)`
  margin-top: 16px;
  border: 1px dashed var(--brd);
  padding: 12px;

  [data-unlock] p {
    margin: 0 0 8px;
    font-weight: 600;
    font-size: 14px;
  }
`

const ReportItem = styled.li`
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--brd);
  list-style: none;

  &:last-child {
    border-bottom: 0;
  }

  small {
    display: block;
    color: var(--fg-3);
    margin-top: 2px;
  }
`

const Aside = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const AlertForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Icon = {
  compass: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.2 5.3-4.8 1.7 2.2-5.3z" fill="currentColor" stroke="none" />
    </svg>
  ),
  share: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  ),
}

/** One spot: the panel's content as a real page plus season, species,
 *  access, nearby spots, reports and a way onto the map. */
export function SpotPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { id } = useParams()
  const spot = SPOTS.find((s) => s.id === id)
  const snapshot = useSnapshot()
  const live = useLiveScores()
  const reportsState = useReports()
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [alertSent, setAlertSent] = useState(false)

  const reports: Report[] = spot ? reportsState.bySpot[spot.id] ?? [] : []

  const view = useMemo(() => {
    if (!spot) return emptyView()
    const r = live.results?.[spot.id]
    if (r) return viewFromResult(applyCommunity(r, reports))
    const s = snapshot?.spots[spot.id]
    return s ? viewFromSnapshot(s, snapshot.generatedAt) : emptyView()
  }, [spot, live.results, snapshot, reports])

  if (!spot) return <NotFoundPage />

  const name = spotName(spot, lang)
  const regionName = t(`region.${spot.region}`)
  const typeName = t(`type.${spot.type}`)
  const species = speciesSorted(spot)
  const speciesNames = species.map((s) => speciesName(s, lang))
  const season = seasonLabel(spot, t)
  const tod = bestTimeOfDay(spot)
  const nearby = nearbySpots(spot, SPOTS)
  const driveMin = estimateDriveMinutes(haversineKm(TBILISI.lat, TBILISI.lon, spot.lat, spot.lon))
  const drive = driveMin >= 60 ? t('trip.driveTimeHours', { h: Math.floor(driveMin / 60), min: driveMin % 60 }) : t('trip.driveTime', { min: driveMin })
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}`
  const pageUrl = absoluteUrl(paths.spot(lang, spot.id))
  const image = `og/${lang}/${spot.id}.png`
  const hasScore = typeof view.score === 'number'

  const description = t('seo.spot.description', {
    name,
    type: typeName.toLowerCase(),
    region: regionName,
    score: hasScore ? view.score : '—',
    species: speciesNames.slice(0, 3).join(', '),
  })

  const crumbs = [
    { name: t('nav.map'), to: paths.map(lang) },
    { name: t('nav.spots'), to: paths.spots(lang) },
    { name: regionName, to: paths.region(lang, spot.region) },
    { name },
  ]

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: hasScore ? `${name} · ${view.score}` : name, url: pageUrl })
        return
      }
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* dismissed */
    }
  }

  const submitAlert = (e: FormEvent) => {
    e.preventDefault()
    try {
      const key = 'ankesi.alerts.waitlist'
      const list = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
      list.push({ email, spotId: spot.id, threshold: 80, at: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(list))
    } catch {
      /* storage unavailable */
    }
    setAlertSent(true)
  }

  return (
    <Page>
      <Head
        title={t('seo.spot.title', { name })}
        description={description}
        path={paths.spot(lang, spot.id)}
        lang={lang}
        image={image}
        type="article"
        jsonLd={[breadcrumbList(crumbs), spotPlace(spot, lang, { description, regionName, image })]}
      />
      <Breadcrumbs items={crumbs} />
      <PageHead>
        <Eyebrow>
          {typeName} · {regionName} · {drive}
        </Eyebrow>
        <H1>{name}</H1>
        <Lead>
          {t('spot.lead', { type: typeName, region: regionName, species: speciesNames.slice(0, 3).join(', ') })}
          {season ? ` ${t('spot.leadSeason', { season })}` : ''}
        </Lead>
      </PageHead>

      <Split>
        <div>
          <Hero>
            {spot.infoOnly && <Muted style={{ marginBottom: 12, color: 'var(--band-dead)' }}>{t('sheet.infoOnly')}</Muted>}
            <ScoreHero score={view.score} confidence={view.confidence} size="page" />
            {view.best && <BestWindowCard best={view.best} lang={lang} now={view.live ? undefined : view.fetchedAt} />}
            {view.hours.length > 1 && (
              <>
                <H3 as="h2" style={{ marginTop: 18 }}>
                  {t('score.next48')}
                </H3>
                <ScoreStrip hours={view.hours} highlight={view.best ?? undefined} />
              </>
            )}
            <Muted style={{ marginTop: 10 }}>
              {hasScore
                ? t(view.live ? 'spot.updatedLive' : 'spot.updatedSnapshot', { time: fmtTime(view.fetchedAt, lang) })
                : t('spot.noData')}
            </Muted>

            {view.factors.length > 0 && (
              <>
                <H3 as="h2" style={{ marginTop: 20 }}>
                  {t('sheet.whyScore', { score: view.score })}
                </H3>
                <FactorImpacts factors={view.factors} />
                <Details>
                  <summary>{t('sheet.showAllFactors', { count: view.factors.length })}</summary>
                  <div style={{ marginTop: 10 }}>
                    <FactorList factors={view.factors} />
                    <Muted style={{ marginTop: 10 }}>
                      {t('score.source', { time: fmtTime(view.fetchedAt, lang) })}
                      {spot.type === 'sea' ? ` · ${t('score.marineSource')}` : ''}
                      <br />
                      {view.waterTempEstimated ? t('sheet.waterTempEstimated') : t('sheet.waterTempMeasured')}
                      <br />
                      {t('score.model', { version: MODEL_VERSION })}
                    </Muted>
                  </div>
                </Details>
              </>
            )}

            {view.hours.length > 1 && (
              <GateBox aria-label={t('spot.premiumTeaser')}>
                <div data-gated aria-hidden="true">
                  <H3 as="p">{t('spot.days3to7')}</H3>
                  <ScoreStrip hours={[...view.hours].reverse()} />
                </div>
                <div data-unlock>
                  <div>
                    <p>{t('spot.premiumTeaser')}</p>
                    <TextLink to={paths.pricing(lang)}>{t('spot.unlock')}</TextLink>
                  </div>
                </div>
              </GateBox>
            )}
          </Hero>

          <Section>
            <H2>{t('spot.whenTitle')}</H2>
            <Card>
              <Facts>
                <dt>{t('spot.season')}</dt>
                <dd>{season || t('spot.seasonNone')}</dd>
                <dt>{t('spot.timeOfDay')}</dt>
                <dd>{t(`spot.tod.${tod}`)}</dd>
                {typeof view.waterTemp === 'number' && (
                  <>
                    <dt>{t('factor.waterTemp')}</dt>
                    <dd>
                      {t('spot.waterTemp', {
                        temp: view.waterTemp.toFixed(1),
                        kind: view.waterTempEstimated ? t('score.estimate') : t('score.measured'),
                      })}
                    </dd>
                  </>
                )}
              </Facts>
            </Card>
          </Section>

          <Section>
            <H2>{t('sheet.species')}</H2>
            <Tags>
              {species.map((sid) => {
                const sp = SPECIES[sid]
                const label = speciesName(sid, lang)
                return sp.protectedSpecies ? (
                  <PillLink key={sid} to={paths.faq(lang) + '#protected-species'} title={t('sheet.protectedSpecies')} style={{ color: 'var(--band-dead)' }}>
                    {label} · {t('spot.protected')}
                  </PillLink>
                ) : (
                  <PillLink key={sid} to={paths.species(lang, sid)} title={t('spot.speciesTemp', { min: sp.tempMin, max: sp.tempMax })}>
                    {label}
                    <small style={{ color: 'var(--fg-3)' }}>
                      {sp.tempMin}–{sp.tempMax} °C
                    </small>
                  </PillLink>
                )
              })}
            </Tags>
            {spot.feeGel !== undefined && <Muted style={{ marginTop: 10 }}>{t('sheet.fee', { fee: spot.feeGel })}</Muted>}
          </Section>

          <Section>
            <H2>{t('sheet.access')}</H2>
            <Prose>
              <p>{lang === 'ka' ? spot.accessKa : spot.accessEn}</p>
              {(spot.noteKa || spot.noteEn) && <p>{lang === 'ka' ? spot.noteKa : spot.noteEn}</p>}
            </Prose>
          </Section>

          <Section>
            <H2>{t('sheet.regulations')}</H2>
            <Card style={{ background: 'var(--alert-bg)', borderColor: 'var(--alert-brd)', color: 'var(--alert-fg)' }}>
              <Prose style={{ color: 'inherit' }}>
                <p>{t('sheet.regulationsUnverified')}</p>
                <p>
                  <TextLink to={paths.faq(lang) + '#closed-seasons'}>{t('spot.regulationsMore')}</TextLink>
                </p>
              </Prose>
            </Card>
          </Section>

          <Section>
            <H2>{t('report.recent')}</H2>
            {reports.length === 0 ? (
              <Card>
                <Prose>
                  <p>{reportsState.ready ? t('spot.noReports') : t('common.loading')}</p>
                </Prose>
                <ButtonRow>
                  <ButtonLink to={paths.mapSpot(lang, spot.id)}>{t('spot.addReport')}</ButtonLink>
                </ButtonRow>
              </Card>
            ) : (
              <Card>
                <ul style={{ margin: 0, padding: 0 }}>
                  {reports.slice(0, 6).map((r) => {
                    const band = ACTIVITY_BAND[r.activity] ?? 'none'
                    return (
                      <ReportItem key={r.id}>
                        <MiniBubble data-band={band}>{r.activity > 0 ? `+${r.activity}` : r.activity}</MiniBubble>
                        <div>
                          <strong>{t(`band.${band}`)}</strong>
                          {r.note ? ` — ${r.note}` : ''}
                          <small>
                            {r.displayName || t('report.anonymous')} · {timeAgo(r.createdAt, lang)}
                          </small>
                        </div>
                      </ReportItem>
                    )
                  })}
                </ul>
                <ButtonRow>
                  <ButtonLink to={paths.mapSpot(lang, spot.id)}>{t('spot.addReport')}</ButtonLink>
                </ButtonRow>
              </Card>
            )}
          </Section>

          <Section>
            <H2>{t('spot.nearby')}</H2>
            <CardGrid $min={260}>
              {nearby.map(({ spot: n, km }) => {
                const r = live.results?.[n.id]
                const v = r ? viewFromResult(r) : snapshot?.spots[n.id] ? viewFromSnapshot(snapshot.spots[n.id], snapshot.generatedAt) : emptyView()
                return (
                  <div key={n.id}>
                    <SpotCard spot={n} view={v} lang={lang} />
                    <Muted style={{ marginTop: 4, paddingLeft: 4 }}>{t('spot.nearbyKm', { km: Math.round(km) })}</Muted>
                  </div>
                )
              })}
            </CardGrid>
            <ButtonRow>
              <TextLink to={paths.region(lang, spot.region)}>{t('spot.moreInRegion', { region: regionName })}</TextLink>
            </ButtonRow>
          </Section>
        </div>

        <Sticky>
          <Aside>
            <StaticMap spot={spot} />
            <ButtonLink to={paths.mapSpot(lang, spot.id)}>
              {Icon.map}
              {t('spot.openOnMap')}
            </ButtonLink>
            <ButtonRow style={{ marginTop: 0 }}>
              <GhostA href={mapsUrl} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                {Icon.compass}
                {t('sheet.navigate')}
              </GhostA>
              <GhostA as="button" type="button" onClick={() => void share()} style={{ flex: 1 }}>
                {Icon.share}
                {copied ? t('sheet.linkCopied') : t('sheet.share')}
              </GhostA>
            </ButtonRow>
            <Muted>
              {spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}
            </Muted>

            <Card>
              <H3>{t('spot.alertTitle')}</H3>
              <Muted>{t('spot.alertHint')}</Muted>
              {alertSent ? (
                <Muted style={{ marginTop: 10, color: 'var(--up-fg)' }}>{t('spot.alertSent')}</Muted>
              ) : (
                <AlertForm onSubmit={submitAlert}>
                  <GlassInput
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('spot.alertEmail')}
                    aria-label={t('spot.alertEmail')}
                    autoComplete="email"
                  />
                  <PrimaryButton type="submit">{t('spot.alertSend')}</PrimaryButton>
                </AlertForm>
              )}
            </Card>

            <Muted>
              <Link to={paths.how(lang)} style={{ color: 'var(--accent)' }}>
                {t('spot.howLink')}
              </Link>
            </Muted>
          </Aside>
        </Sticky>
      </Split>
    </Page>
  )
}
