import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Spot, SpotResult } from '../types'
import { bandOf } from '../lib/scoring'
import { estimateDriveMinutes, haversineKm, tbilisiDateKey, tbilisiParts } from '../lib/format'

type Day = 0 | 1 | 2
const DAY_KEYS: Record<Day, string> = { 0: 'trip.today', 1: 'trip.tomorrow', 2: 'trip.dayAfter' }

interface Props {
  spots: Spot[]
  results: Record<string, SpotResult>
  onSelect: (id: string) => void
}

interface Ranked {
  spot: Spot
  score: number
  driveMin: number | null
}

export function TripPlanner({ spots, results, onSelect }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'ka'
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState<Day>(0)
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null)
  const [locating, setLocating] = useState(false)

  const ranked = useMemo<Ranked[]>(() => {
    const key = tbilisiDateKey(day)
    const out: Ranked[] = []
    for (const spot of spots) {
      if (spot.infoOnly) continue
      const r = results[spot.id]
      if (!r) continue
      const dayHours = r.hours.filter((h) => {
        const p = tbilisiParts(h.time)
        return p.dateKey === key && p.hour >= 6 && p.hour <= 21
      })
      if (dayHours.length < 3) continue
      const score = Math.round(dayHours.reduce((a, h) => a + h.score, 0) / dayHours.length)
      const driveMin = pos ? estimateDriveMinutes(haversineKm(pos.lat, pos.lon, spot.lat, spot.lon)) : null
      out.push({ spot, score, driveMin })
    }
    out.sort((a, b) => b.score - a.score)
    return out
  }, [spots, results, day, pos])

  const locate = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lon: p.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    )
  }

  const driveLabel = (min: number) =>
    min >= 60
      ? t('trip.driveTimeHours', { h: Math.floor(min / 60), min: min % 60 })
      : t('trip.driveTime', { min })

  if (!open) {
    return (
      <button type="button" className="pill-button glass" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 11 22 2l-9 19-2-8-8-2z" />
        </svg>
        {t('trip.open')}
      </button>
    )
  }

  return (
    <div className="panel glass">
      <div className="panel-head">
        <span className="panel-title">{t('trip.title')}</span>
        <button type="button" className="iconbtn" onClick={() => setOpen(false)} aria-label={t('sheet.close')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="segmented">
        {([0, 1, 2] as Day[]).map((d) => (
          <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)}>
            {t(DAY_KEYS[d])}
          </button>
        ))}
      </div>

      <div className="panel-list">
        {ranked.length === 0 && <div className="muted" style={{ padding: 12 }}>{t('trip.empty')}</div>}
        {ranked.map((r, i) => (
          <button
            key={r.spot.id}
            type="button"
            className="list-item"
            onClick={() => {
              onSelect(r.spot.id)
              setOpen(false)
            }}
          >
            <span className="rank">{i + 1}</span>
            <span className="minibubble" data-band={bandOf(r.score)}>
              {r.score}
            </span>
            <span className="name">
              {lang === 'ka' ? r.spot.nameKa : r.spot.nameEn}
              <small>
                {t(`region.${r.spot.region}`)}
                {r.driveMin !== null ? ` · ${driveLabel(r.driveMin)}` : ''}
              </small>
            </span>
          </button>
        ))}
      </div>

      <div className="panel-foot">
        <span>{pos ? t('trip.driveEstimate') : t('trip.locationNeeded')}</span>
        {!pos && (
          <button type="button" className="badge accent" onClick={locate} disabled={locating}>
            {t('trip.useLocation')}
          </button>
        )}
      </div>
    </div>
  )
}
