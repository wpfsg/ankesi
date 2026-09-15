import { useEffect, useMemo, useState } from 'react'
import { motion, animate, useDragControls, useMotionValue, type PanInfo } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Report, Spot, SpotResult } from '../types'
import { SPECIES } from '../data/species'
import { bandOf, bestWindow, weakestFactor, MODEL_VERSION } from '../lib/scoring'
import { fmtSigned, fmtTime, timeAgo } from '../lib/format'
import { photoUrl } from '../lib/supabase'
import { ScoreStrip } from './ScoreStrip'
import { FactorList } from './FactorList'

type Snap = 'peek' | 'half' | 'full'
export type SpotAction = 'catch' | 'report' | 'save'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const ACTIVITY_BAND: Record<number, string> = { [-2]: 'dead', [-1]: 'slow', 0: 'ok', 1: 'good', 2: 'great' }

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

export function SpotSheet({ spot, result, reports, saved, manualPressure, onManualPressure, onAction, onFlag, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'ka'
  const vh = useViewportHeight()
  const snaps = useMemo(() => ({ peek: 210, half: Math.round(vh * 0.52), full: Math.round(vh * 0.92) }), [vh])
  const [snap, setSnap] = useState<Snap>('peek')
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const y = useMotionValue(vh)
  const dragControls = useDragControls()

  const goTo = (s: Snap) => {
    setSnap(s)
    animate(y, vh - snaps[s], SPRING)
  }

  useEffect(() => {
    setSnap('peek')
    animate(y, vh - snaps.peek, SPRING)
  }, [spot.id, snaps, vh, y])

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

  const flag = (id: string) => {
    setFlagged((s) => new Set(s).add(id))
    onFlag(id)
  }

  return (
    <motion.section
      className="sheet glass"
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
      <div
        className="sheet-handle"
        onPointerDown={(e) => dragControls.start(e)}
        onDoubleClick={() => goTo(snap === 'full' ? 'peek' : 'full')}
      />
      <div className="sheet-body" data-scroll={snap === 'full'}>
        <div className="sheet-head">
          <div className="sheet-title">
            {name}
            <div className="sheet-sub">
              {t(`type.${spot.type}`)} · {t(`region.${spot.region}`)}
            </div>
          </div>
          <button type="button" className="iconbtn" onClick={onClose} aria-label={t('sheet.close')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="score-row" onClick={() => snap === 'peek' && goTo('half')}>
          <div className="score-big tabular" data-band={band}>
            {now ? now.score : '·'}
          </div>
          <div className="score-meta">
            <div className="score-band">{t(`band.${band}`)}</div>
            <div className="muted">
              {t('confidence.label')}: {t(`confidence.${result?.confidence ?? 'low'}`)}
            </div>
          </div>
        </div>

        <p className="summary">
          {t(`summary.${band}`)} {weakest ? t(`hint.${weakest.key}`) : ''}
        </p>

        <div className="actions">
          <button type="button" className="btn" onClick={() => onAction('catch')}>
            {t('actions.logCatch')}
          </button>
          <button type="button" className="btn" onClick={() => onAction('report')}>
            {t('actions.report')}
          </button>
          <button type="button" className="btn" aria-pressed={saved} onClick={() => onAction('save')}>
            {saved ? t('actions.saved') : t('actions.save')}
          </button>
        </div>

        {spot.infoOnly && <div className="notice warn" style={{ marginTop: 12 }}>{t('sheet.infoOnly')}</div>}

        {result && (
          <>
            {window48 && (
              <>
                <div className="h">{t('score.bestWindow')}</div>
                <div>
                  {t('score.bestWindowValue', {
                    start: fmtTime(window48.start, lang),
                    end: fmtTime(window48.end, lang),
                    avg: window48.avg,
                  })}
                </div>
              </>
            )}

            <div className="h">{t('score.next48')}</div>
            <ScoreStrip hours={result.hours} />

            <div className="h">{t('report.recent')}</div>
            {result.community && (
              <div className="notice" style={{ marginBottom: 8 }}>
                {t('report.adjustment')}:{' '}
                <strong className="tabular">
                  {t('report.adjustmentValue', { delta: fmtSigned(result.community.delta, 0), count: result.community.count })}
                </strong>
              </div>
            )}
            {reports.length === 0 && <div className="muted">{t('report.none')}</div>}
            {reports.slice(0, 8).map((r) => {
              const url = photoUrl(r.photoPath)
              return (
                <div key={r.id} className="report-item">
                  <span className="minibubble" data-band={ACTIVITY_BAND[r.activity] ?? 'none'}>
                    {r.activity > 0 ? `+${r.activity}` : r.activity}
                  </span>
                  <div className="report-body">
                    <div>
                      <strong>{t(`band.${ACTIVITY_BAND[r.activity] ?? 'none'}`)}</strong>
                      {r.note ? ` — ${r.note}` : ''}
                    </div>
                    <div className="report-meta">
                      <span>{r.displayName || t('report.anonymous')}</span>
                      <span>{timeAgo(r.createdAt, lang)}</span>
                      <button type="button" onClick={() => flag(r.id)} disabled={flagged.has(r.id)}>
                        {flagged.has(r.id) ? t('report.flagged') : t('report.flag')}
                      </button>
                    </div>
                  </div>
                  {url && <img className="thumb" src={url} alt="" loading="lazy" />}
                </div>
              )
            })}

            <div className="h">{t('score.breakdown')}</div>
            {now && <FactorList factors={now.factors} />}
            <p className="muted" style={{ marginTop: 10 }}>
              {t('score.source', { time: fmtTime(result.fetchedAt, lang) })}
              {spot.type === 'sea' ? ` · ${t('score.marineSource')}` : ''}
              <br />
              {result.waterTempEstimated ? t('sheet.waterTempEstimated') : t('sheet.waterTempMeasured')}
              <br />
              {t('score.model', { version: MODEL_VERSION })}
            </p>
          </>
        )}

        <div className="h">{t('sheet.manualPressure')}</div>
        <div className="field">
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
            <button type="button" className="btn" onClick={() => onManualPressure(undefined)}>
              {t('sheet.manualPressureClear')}
            </button>
          )}
        </div>
        <p className="muted" style={{ marginTop: 6 }}>
          {t('sheet.manualPressureHelp')}
        </p>

        <div className="h">{t('sheet.species')}</div>
        <div className="row">
          {speciesList.map(([id]) => {
            const sp = SPECIES[id as keyof typeof SPECIES]
            if (!sp) return null
            return (
              <span key={id} className={`chipmark${sp.protectedSpecies ? ' protected' : ''}`} title={sp.protectedSpecies ? t('sheet.protectedSpecies') : ''}>
                {lang === 'ka' ? sp.nameKa : sp.nameEn}
              </span>
            )
          })}
        </div>

        {spot.feeGel !== undefined && <p>{t('sheet.fee', { fee: spot.feeGel })}</p>}

        <div className="h">{t('sheet.access')}</div>
        <p style={{ margin: 0 }}>{lang === 'ka' ? spot.accessKa : spot.accessEn}</p>

        {(spot.noteKa || spot.noteEn) && (
          <>
            <div className="h">{t('sheet.notes')}</div>
            <p style={{ margin: 0 }}>{lang === 'ka' ? spot.noteKa : spot.noteEn}</p>
          </>
        )}

        <div className="h">{t('sheet.regulations')}</div>
        <div className="notice">{t('sheet.regulationsUnverified')}</div>

        <div style={{ marginTop: 20 }}>
          <a className="btn accent block" href={mapsUrl} target="_blank" rel="noreferrer">
            {t('sheet.navigate')}
          </a>
        </div>
      </div>
    </motion.section>
  )
}
