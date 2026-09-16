import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { animate, useDragControls, useMotionValue, type PanInfo } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { FactorResult, Report, Spot, SpotResult } from '../types'
import { SPECIES } from '../data/species'
import { bandOf, bestWindow, weakestFactor, MODEL_VERSION } from '../lib/scoring'
import { estimateDriveMinutes, fmtSigned, fmtTime, haversineKm, tbilisiDateKey, tbilisiParts, timeAgo } from '../lib/format'
import { useOrigin } from '../lib/origin'
import { photoUrl } from '../lib/supabase'
import { ScoreStrip } from './ScoreStrip'
import { FactorList } from './FactorList'
import { rawLabel } from '../lib/factorLabel'
import {
  Btn,
  CloseBtn,
  MiniBubble,
  Muted,
  Notice,
  PanelHead,
  PanelSub,
  PanelTitle,
  SquareBtn,
  Tabular,
  Thumb,
} from '../styles/shared'
import {
  DesktopPanel,
  Sheet,
  Handle,
  Body,
  HeadText,
  InfoOnly,
  Hero,
  ScoreRing,
  RingValue,
  HeroMeta,
  BandLabel,
  BandSummary,
  ConfChip,
  SummaryBox,
  BestCard,
  H4,
  Disclosure,
  ImpactList,
  ImpactRow,
  ImpactIcon,
  ImpactText,
  TextBtn,
  DisclosureBody,
  ReportItem,
  ReportBody,
  ReportMeta,
  Tags,
  Tag,
  Para,
  Alert,
  Field,
  CopiedNote,
  ActionBar,
  NavBtn,
} from './SpotSheet.styles'

type Snap = 'peek' | 'half' | 'full'
export type SpotAction = 'catch' | 'report' | 'save'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const ACTIVITY_BAND: Record<number, string> = { [-2]: 'dead', [-1]: 'slow', 0: 'ok', 1: 'good', 2: 'great' }
const DESKTOP = '(min-width: 720px)'

interface Props {
  spot: Spot
  result?: SpotResult
  reports: Report[]
  saved: boolean
  manualPressure?: number
  onManualPressure: (v: number | undefined) => void
  onAction: (kind: SpotAction) => void
  onFlag: (reportId: string) => void
  onClose: () => void
}

function useViewportHeight() {
  const [vh, setVh] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return vh
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** How far a factor pulls the score from neutral, weighted. */
function impact(f: FactorResult): number {
  return Math.abs(f.value - 0.5) * f.weight
}

function toneOf(f: FactorResult): 'up' | 'down' | 'flat' {
  if (f.value >= 0.6) return 'up'
  if (f.value <= 0.4) return 'down'
  return 'flat'
}

const TONE_MARK = { up: '↑', down: '↓', flat: '•' } as const

/* Icons ------------------------------------------------------------------- */

const IconX = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

const IconCompass = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2.2 5.3-4.8 1.7 2.2-5.3z" fill="currentColor" stroke="none" />
  </svg>
)

const IconHook = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3v3" />
    <circle cx="14" cy="8" r="2" />
    <path d="M14 10v6a4 4 0 0 1-8 0v-1" />
    <path d="M6 15l-2 2" />
  </svg>
)

const IconBubble = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 12a8 8 0 0 1-8 8H5.5L4 21.5V12a8 8 0 1 1 16 0z" />
  </svg>
)

const IconShare = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </svg>
)

const IconWarn = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 2.5 20h19z" />
    <path d="M12 9v5" />
    <path d="M12 17.5h.01" />
  </svg>
)

function IconStar({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
    </svg>
  )
}

/* Component --------------------------------------------------------------- */

export function SpotSheet({ spot, result, reports, saved, manualPressure, onManualPressure, onAction, onFlag, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'ka'
  const desktop = useMediaQuery(DESKTOP)
  const { origin } = useOrigin()
  const vh = useViewportHeight()
  const snaps = useMemo(() => {
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72
    return { peek: 210, half: Math.round(vh * 0.52), full: vh - headerH - 8 }
  }, [vh])
  const [snap, setSnap] = useState<Snap>('full')
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [allFactors, setAllFactors] = useState(false)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)
  const y = useMotionValue(vh)
  const dragControls = useDragControls()

  const goTo = (s: Snap) => {
    setSnap(s)
    animate(y, vh - snaps[s], SPRING)
  }

  // Open fully on selection; drag or double-tap the handle to collapse.
  useEffect(() => {
    setSnap('full')
    animate(y, vh - snaps.full, SPRING)
  }, [spot.id, snaps, vh, y])

  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * 0.12
    const height = vh - projected
    if (height < snaps.peek * 0.55) {
      onClose()
      return
    }
    const order: Snap[] = ['peek', 'half', 'full']
    let best: Snap = 'peek'
    let bestDist = Infinity
    for (const s of order) {
      const d = Math.abs(snaps[s] - height)
      if (d < bestDist) {
        bestDist = d
        best = s
      }
    }
    goTo(best)
  }

  const now = result?.hours[0]
  const band = bandOf(now?.score)
  const weakest = now ? weakestFactor(now) : null
  const window48 = result ? bestWindow(result.hours) : null
  const name = lang === 'ka' ? spot.nameKa : spot.nameEn
  const speciesList = Object.entries(spot.species).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}`
  const topFactors = now ? [...now.factors].sort((a, b) => impact(b) - impact(a)).slice(0, 5) : []

  const driveMin = estimateDriveMinutes(haversineKm(origin.lat, origin.lon, spot.lat, spot.lon))
  const driveLabel =
    driveMin >= 60
      ? t('trip.driveTimeHours', { h: Math.floor(driveMin / 60), min: driveMin % 60 })
      : t('trip.driveTime', { min: driveMin })

  const bestIsToday = window48 ? tbilisiParts(window48.start).dateKey === tbilisiDateKey(0) : false

  const flag = (id: string) => {
    setFlagged((s) => new Set(s).add(id))
    onFlag(id)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* user dismissed the share sheet or clipboard is unavailable */
    }
  }

  const head = (
    <PanelHead>
      <HeadText>
        <PanelTitle>{name}</PanelTitle>
        <PanelSub>
          {t(`type.${spot.type}`)} · {t(`region.${spot.region}`)} · {driveLabel}
        </PanelSub>
      </HeadText>
      <CloseBtn type="button" onClick={onClose} aria-label={t('sheet.close')}>
        {IconX}
      </CloseBtn>
    </PanelHead>
  )

  const body = (
    <>
      {spot.infoOnly && (
        <InfoOnly>
          <Notice $warn>{t('sheet.infoOnly')}</Notice>
        </InfoOnly>
      )}

      <Hero onClick={() => !desktop && snap === 'peek' && goTo('half')}>
        <ScoreRing data-band={band} style={{ '--pct': `${now?.score ?? 0}%` } as CSSProperties}>
          <RingValue>{now ? now.score : '·'}</RingValue>
        </ScoreRing>
        <HeroMeta data-band={band}>
          <BandLabel>{t(`band.${band}`)}</BandLabel>
          <BandSummary>{t(`summary.${band}`)}</BandSummary>
          <ConfChip>
            {t('confidence.label')}: {t(`confidence.${result?.confidence ?? 'low'}`)}
          </ConfChip>
        </HeroMeta>
      </Hero>

      {(weakest || result?.community) && (
        <SummaryBox>
          {weakest && t(`hint.${weakest.key}`)}
          {weakest && result?.community ? ' ' : ''}
          {result?.community && (
            <>
              {t('report.adjustment')}:{' '}
              <Tabular as="strong">
                {t('report.adjustmentValue', { delta: fmtSigned(result.community.delta, 0), count: result.community.count })}
              </Tabular>
            </>
          )}
        </SummaryBox>
      )}

      {window48 && (
        <BestCard>
          <small>{bestIsToday ? t('sheet.bestToday') : t('sheet.bestUpcoming')}</small>
          <b>
            {fmtTime(window48.start, lang)} – {fmtTime(window48.end, lang)}
          </b>
          <i>{t('sheet.bestWindowNote', { avg: window48.avg })}</i>
        </BestCard>
      )}

      {result && now && (
        <>
          <H4>{t('score.next48')}</H4>
          <ScoreStrip hours={result.hours} highlight={window48 ?? undefined} />

          <Disclosure open>
            <summary>{t('sheet.whyScore', { score: now.score })}</summary>
            <ImpactList>
              {topFactors.map((f) => {
                const tone = toneOf(f)
                const raw = rawLabel(f)
                const tail = tone === 'up' ? t('sheet.helps') : tone === 'down' ? t(`hint.${f.key}`) : ''
                return (
                  <ImpactRow key={f.key}>
                    <ImpactIcon $tone={tone} aria-hidden="true">
                      {TONE_MARK[tone]}
                    </ImpactIcon>
                    <ImpactText>
                      <b>
                        {t(`factor.${f.key}`)}
                        {f.state ? ` · ${t(`state.${f.state}`)}` : ''}
                      </b>
                      <span>
                        {raw}
                        {raw && tail ? ' — ' : ''}
                        {tail}
                      </span>
                    </ImpactText>
                  </ImpactRow>
                )
              })}
            </ImpactList>
            <TextBtn type="button" onClick={() => setAllFactors((v) => !v)} aria-expanded={allFactors}>
              {allFactors ? t('sheet.hideFactors') : t('sheet.showAllFactors', { count: now.factors.length })}
            </TextBtn>
            {allFactors && (
              <DisclosureBody>
                <FactorList factors={now.factors} />
                <Muted as="p" style={{ margin: '10px 0 0' }}>
                  {t('score.source', { time: fmtTime(result.fetchedAt, lang) })}
                  {spot.type === 'sea' ? ` · ${t('score.marineSource')}` : ''}
                  <br />
                  {result.waterTempEstimated ? t('sheet.waterTempEstimated') : t('sheet.waterTempMeasured')}
                  <br />
                  {t('score.model', { version: MODEL_VERSION })}
                </Muted>
              </DisclosureBody>
            )}
          </Disclosure>
        </>
      )}

      <H4>{t('report.recent')}</H4>
      {reports.length === 0 && <Muted>{t('report.none')}</Muted>}
      {reports.slice(0, 8).map((r) => {
        const url = photoUrl(r.photoPath)
        const activityBand = ACTIVITY_BAND[r.activity] ?? 'none'
        return (
          <ReportItem key={r.id}>
            <MiniBubble data-band={activityBand}>{r.activity > 0 ? `+${r.activity}` : r.activity}</MiniBubble>
            <ReportBody>
              <div>
                <strong>{t(`band.${activityBand}`)}</strong>
                {r.note ? ` — ${r.note}` : ''}
              </div>
              <ReportMeta>
                <span>{r.displayName || t('report.anonymous')}</span>
                <span>{timeAgo(r.createdAt, lang)}</span>
                <button type="button" onClick={() => flag(r.id)} disabled={flagged.has(r.id)}>
                  {flagged.has(r.id) ? t('report.flagged') : t('report.flag')}
                </button>
              </ReportMeta>
            </ReportBody>
            {url && <Thumb src={url} alt="" loading="lazy" />}
          </ReportItem>
        )
      })}

      <H4>{t('sheet.species')}</H4>
      <Tags>
        {speciesList.map(([id]) => {
          const sp = SPECIES[id as keyof typeof SPECIES]
          if (!sp) return null
          return (
            <Tag key={id} $protected={!!sp.protectedSpecies} title={sp.protectedSpecies ? t('sheet.protectedSpecies') : undefined}>
              {lang === 'ka' ? sp.nameKa : sp.nameEn}
            </Tag>
          )
        })}
      </Tags>
      {spot.feeGel !== undefined && <Para style={{ marginTop: 8 }}>{t('sheet.fee', { fee: spot.feeGel })}</Para>}

      <H4>{t('sheet.access')}</H4>
      <Para>{lang === 'ka' ? spot.accessKa : spot.accessEn}</Para>

      {(spot.noteKa || spot.noteEn) && (
        <>
          <H4>{t('sheet.notes')}</H4>
          <Para>{lang === 'ka' ? spot.noteKa : spot.noteEn}</Para>
        </>
      )}

      <Alert role="note">
        {IconWarn}
        <span>{t('sheet.regulationsUnverified')}</span>
      </Alert>

      <Disclosure>
        <summary>{t('sheet.advanced')}</summary>
        <DisclosureBody>
          <H4 style={{ margin: '0 0 8px' }}>{t('sheet.manualPressure')}</H4>
          <Field>
            <input
              type="number"
              inputMode="decimal"
              min={900}
              max={1100}
              step={0.1}
              placeholder="1013.2 hPa"
              value={manualPressure ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onManualPressure(Number.isFinite(v) ? v : undefined)
              }}
            />
            {manualPressure !== undefined && (
              <Btn type="button" onClick={() => onManualPressure(undefined)}>
                {t('sheet.manualPressureClear')}
              </Btn>
            )}
          </Field>
          <Muted as="p" style={{ margin: '6px 0 0' }}>
            {t('sheet.manualPressureHelp')}
          </Muted>
        </DisclosureBody>
      </Disclosure>
    </>
  )

  const footer = (
    <>
      {copied && <CopiedNote role="status">{t('sheet.linkCopied')}</CopiedNote>}
      <ActionBar>
        <NavBtn as="a" href={mapsUrl} target="_blank" rel="noreferrer">
          {IconCompass}
          {t('sheet.navigate')}
        </NavBtn>
        <SquareBtn type="button" onClick={() => onAction('catch')} aria-label={t('actions.logCatch')} title={t('actions.logCatch')}>
          {IconHook}
        </SquareBtn>
        <SquareBtn type="button" onClick={() => onAction('report')} aria-label={t('actions.report')} title={t('actions.report')}>
          {IconBubble}
        </SquareBtn>
        <SquareBtn
          type="button"
          aria-pressed={saved}
          onClick={() => onAction('save')}
          aria-label={saved ? t('actions.saved') : t('actions.save')}
          title={saved ? t('actions.saved') : t('actions.save')}
        >
          <IconStar filled={saved} />
        </SquareBtn>
        <SquareBtn type="button" onClick={share} aria-label={t('sheet.share')} title={t('sheet.share')}>
          {IconShare}
        </SquareBtn>
      </ActionBar>
    </>
  )

  if (desktop) {
    return (
      <DesktopPanel aria-label={name}>
        {head}
        <Body>{body}</Body>
        {footer}
      </DesktopPanel>
    )
  }

  return (
    <Sheet
      style={{ y, height: snaps.full }}
      drag="y"
      dragListener={snap !== 'full'}
      dragControls={dragControls}
      dragConstraints={{ top: vh - snaps.full, bottom: vh - snaps.peek * 0.4 }}
      dragElastic={0.04}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      aria-label={name}
    >
      <Handle onPointerDown={(e) => dragControls.start(e)} onDoubleClick={() => goTo(snap === 'full' ? 'peek' : 'full')} />
      {head}
      <Body data-scroll={snap === 'full'}>{body}</Body>
      {footer}
    </Sheet>
  )
}
