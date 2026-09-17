import type { SpeciesId, Spot } from '../types'
import { SPECIES } from '../data/species'
import { haversineKm } from './format'

/** Translator shape used here, so this module stays free of React. */
export type Translate = (key: string) => string

/* Content derived from the static spot data for catalog and spot pages. */

export function speciesSorted(spot: Spot): SpeciesId[] {
  return (Object.entries(spot.species) as [SpeciesId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .filter((id) => id in SPECIES)
}

/** Months (1–12) when at least half of the typical catch is in season. */
export function seasonMonths(spot: Spot): number[] {
  const entries = Object.entries(spot.species) as [SpeciesId, number][]
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1
  const out: number[] = []
  for (let m = 1; m <= 12; m++) {
    let share = 0
    for (const [id, v] of entries) {
      const sp = SPECIES[id]
      if (sp && sp.months.includes(m)) share += v / total
    }
    if (share >= 0.5) out.push(m)
  }
  return out
}

/** Contiguous month ranges, wrapping over the new year: [[5,10]] or [[10,3]]. */
export function monthRanges(months: number[]): [number, number][] {
  if (months.length === 0) return []
  if (months.length === 12) return [[1, 12]]
  const set = new Set(months)
  const ranges: [number, number][] = []
  // Start scanning at a month that follows a gap so wraps come out whole.
  let start = 1
  while (set.has(start) && set.has(start === 1 ? 12 : start - 1)) start++
  for (let k = 0; k < 12; k++) {
    const m = ((start - 1 + k) % 12) + 1
    const prev = m === 1 ? 12 : m - 1
    if (!set.has(m)) continue
    if (!set.has(prev) || ranges.length === 0) ranges.push([m, m])
    else ranges[ranges.length - 1][1] = m
  }
  return ranges
}

/* Month names come from i18n rather than Intl: server and browser ICU data
   can differ, and prerendered text must match what the browser renders. */
export function monthName(m: number, t: Translate): string {
  return t(`months.${m}`)
}

export function seasonLabel(spot: Spot, t: Translate): string {
  const ranges = monthRanges(seasonMonths(spot))
  return ranges.map(([a, b]) => (a === b ? monthName(a, t) : `${monthName(a, t)} – ${monthName(b, t)}`)).join(', ')
}

/** Share of typical catch that feeds at night. */
export function nocturnalShare(spot: Spot): number {
  const entries = Object.entries(spot.species) as [SpeciesId, number][]
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1
  return entries.filter(([id]) => SPECIES[id]?.nocturnal).reduce((a, [, v]) => a + v / total, 0)
}

export type TimeOfDay = 'golden' | 'night' | 'mixed'

export function bestTimeOfDay(spot: Spot): TimeOfDay {
  const n = nocturnalShare(spot)
  if (n >= 0.5) return 'night'
  if (n >= 0.25) return 'mixed'
  return 'golden'
}

export function nearbySpots(spot: Spot, all: Spot[], n = 4): { spot: Spot; km: number }[] {
  return all
    .filter((s) => s.id !== spot.id && !s.infoOnly)
    .map((s) => ({ spot: s, km: haversineKm(spot.lat, spot.lon, s.lat, s.lon) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n)
}

export function spotName(spot: Spot, lang: string): string {
  return lang === 'ka' ? spot.nameKa : spot.nameEn
}

export function speciesName(id: SpeciesId, lang: string): string {
  const sp = SPECIES[id]
  return lang === 'ka' ? sp.nameKa : sp.nameEn
}
