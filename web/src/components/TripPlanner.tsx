import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Region, SpeciesId, Spot, SpotResult } from '../types'
import { SPECIES } from '../data/species'
import { bandOf, bestWindow } from '../lib/scoring'
import { estimateDriveMinutes, fmtTime, haversineKm, tbilisiDateKey, tbilisiParts } from '../lib/format'
import { useOrigin } from '../lib/origin'
import { Chip, CloseBtn, Muted, PanelHead, PanelSub, PanelTitle, ScoreSquare } from '../styles/shared'
import {
  Chevron,
  DayTabs,
  Empty,
  Filters,
  FooterNote,
  HeadText,
  Launcher,
  List,
  LocateBtn,
  PlannerPanel,
  Rank,
  Row,
  RowBest,
  RowMeta,
  RowName,
  RowText,
  PlannerFooter,
} from './TripPlanner.styles'
import { GlassSelect } from './GlassSelect'

type Day = 0 | 1 | 2
const DAY_KEYS: Record<Day, string> = { 0: 'trip.today', 1: 'trip.tomorrow', 2: 'trip.dayAfter' }
const DAYS: Day[] = [0, 1, 2]

/** Drive-time cap for the "≤ 2 h" chip, minutes. */
const WITHIN_MIN = 120

type Sort = 'score' | 'distance'

interface Props {
  spots: Spot[]
  results: Record<string, SpotResult>
  onSelect: (id: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Phones: hide the launcher while a spot sheet covers the map. */
  hideLauncher?: boolean
  updatedAt?: Date
}

interface Ranked {
  spot: Spot
  score: number
  driveMin: number
  best: { start: Date; end: Date; avg: number } | null
}

export function TripPlanner({ spots, results, onSelect, open, onOpenChange, hideLauncher, updatedAt }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'ka'
  const { origin, locating, locate } = useOrigin()

  const [day, setDay] = useState<Day>(0)
  const [within2h, setWithin2h] = useState(false)
  const [species, setSpecies] = useState<SpeciesId | ''>('')
  const [region, setRegion] = useState<Region | ''>('')
  const [sort, setSort] = useState<Sort>('score')

  const filtersActive = within2h || species !== '' || region !== ''

  /* Options for the species / region selects: only what actually occurs. */
  const speciesOptions = useMemo(() => {
    const seen = new Set<SpeciesId>()
    for (const s of spots) for (const k of Object.keys(s.species)) seen.add(k as SpeciesId)
    return [...seen]
      .map((id) => ({ id, label: lang === 'ka' ? SPECIES[id].nameKa : SPECIES[id].nameEn }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [spots, lang])

  const regionOptions = useMemo(() => {
    const seen = new Set<Region>()
    for (const s of spots) seen.add(s.region)
    return [...seen]
      .map((id) => ({ id, label: t(`region.${id}`) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [spots, t])

  const speciesChoices = useMemo(() => speciesOptions.map((o) => ({ value: o.id, label: o.label })), [speciesOptions])
  const regionChoices = useMemo(() => regionOptions.map((o) => ({ value: o.id, label: o.label })), [regionOptions])

  /* Every scorable spot for the chosen day, before filters. */
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
      const driveMin = estimateDriveMinutes(haversineKm(origin.lat, origin.lon, spot.lat, spot.lon))
      out.push({ spot, score, driveMin, best: bestWindow(dayHours, 3) })
    }
    return out
  }, [spots, results, day, origin.lat, origin.lon])

  const rows = useMemo(() => {
    const list = ranked.filter(
      (r) =>
        (!within2h || r.driveMin <= WITHIN_MIN) &&
        (species === '' || species in r.spot.species) &&
        (region === '' || r.spot.region === region),
    )
    list.sort((a, b) =>
      sort === 'score'
        ? b.score - a.score || a.driveMin - b.driveMin
        : a.driveMin - b.driveMin || b.score - a.score,
    )
    return list
  }, [ranked, within2h, species, region, sort])

  const driveLabel = (min: number) =>
    min >= 60
      ? t('trip.driveTimeHours', { h: Math.floor(min / 60), min: min % 60 })
      : t('trip.driveTime', { min })

  const toggleWithin2h = () => {
    if (within2h) {
      setWithin2h(false)
      return
    }
    // Turn the filter on straight away; distances switch from Tbilisi to
    // the user once the browser answers (or stay on Tbilisi if it refuses).
    setWithin2h(true)
    if (origin.source !== 'user') void locate()
  }

  const clearFilters = () => {
    setWithin2h(false)
    setSpecies('')
    setRegion('')
  }

  const pick = (id: string) => {
    onSelect(id)
    onOpenChange(false)
  }

  if (!open) {
    if (hideLauncher) return null
    return (
      <Launcher type="button" onClick={() => onOpenChange(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
        </svg>
        {t('trip.open')}
      </Launcher>
    )
  }

  return (
    <PlannerPanel aria-label={t('trip.title')}>
      <PanelHead>
        <HeadText>
          <PanelTitle>{t('trip.open')}</PanelTitle>
          {updatedAt && (
            <PanelSub>{t('trip.subtitle', { count: rows.length, time: fmtTime(updatedAt, lang) })}</PanelSub>
          )}
        </HeadText>
        <CloseBtn type="button" onClick={() => onOpenChange(false)} aria-label={t('sheet.close')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </CloseBtn>
      </PanelHead>

      <DayTabs role="tablist">
        {DAYS.map((d) => (
          <button key={d} type="button" role="tab" aria-selected={day === d} onClick={() => setDay(d)}>
            {t(DAY_KEYS[d])}
          </button>
        ))}
      </DayTabs>

      <Filters>
        <Chip type="button" $on={within2h} aria-pressed={within2h} onClick={toggleWithin2h}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 17h14M3 12l2-5h14l2 5v5H3z" />
            <circle cx="7.5" cy="17" r="1.5" />
            <circle cx="16.5" cy="17" r="1.5" />
          </svg>
          {t('trip.within2h')}
        </Chip>

        <GlassSelect
          value={species}
          options={speciesChoices}
          placeholder={t('trip.species')}
          allLabel={t('trip.allSpecies')}
          ariaLabel={t('trip.species')}
          onChange={setSpecies}
        />

        <GlassSelect
          value={region}
          options={regionChoices}
          placeholder={t('trip.region')}
          allLabel={t('trip.allRegions')}
          ariaLabel={t('trip.region')}
          onChange={setRegion}
        />

        <Chip type="button" onClick={() => setSort((s) => (s === 'score' ? 'distance' : 'score'))}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3" />
          </svg>
          {sort === 'score' ? t('trip.sortScore') : t('trip.sortDistance')}
        </Chip>
      </Filters>

      <List>
        {ranked.length === 0 && (
          <Empty>
            <Muted>{t('trip.empty')}</Muted>
          </Empty>
        )}
        {ranked.length > 0 && rows.length === 0 && (
          <Empty>
            <Muted>{t('trip.noMatch')}</Muted>
            {filtersActive && (
              <Chip type="button" onClick={clearFilters}>
                {t('trip.clearFilters')}
              </Chip>
            )}
          </Empty>
        )}
        {rows.map((r, i) => (
          <Row key={r.spot.id} type="button" onClick={() => pick(r.spot.id)}>
            <Rank>{i + 1}</Rank>
            <ScoreSquare data-band={bandOf(r.score)}>{r.score}</ScoreSquare>
            <RowText>
              <RowName>{lang === 'ka' ? r.spot.nameKa : r.spot.nameEn}</RowName>
              <RowMeta>
                {t(`type.${r.spot.type}`)} · {t(`region.${r.spot.region}`)} · {driveLabel(r.driveMin)}
              </RowMeta>
              {r.best && (
                <RowBest>
                  <em>{t('trip.bestAt', { start: fmtTime(r.best.start, lang), end: fmtTime(r.best.end, lang) })}</em>
                  {` · ${r.best.avg}`}
                </RowBest>
              )}
            </RowText>
            <Chevron aria-hidden="true" />
          </Row>
        ))}
      </List>

      <PlannerFooter>
        <FooterNote>{origin.source === 'user' ? t('trip.fromYou') : t('trip.fromTbilisi')}</FooterNote>
        {origin.source !== 'user' && (
          <LocateBtn type="button" onClick={() => void locate()} disabled={locating}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {t('trip.useLocation')}
          </LocateBtn>
        )}
      </PlannerFooter>
    </PlannerPanel>
  )
}
