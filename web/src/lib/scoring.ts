import * as SunCalc from 'suncalc'
import type {
  Band,
  CommunityAdjustment,
  Confidence,
  Report,
  FactorKey,
  FactorResult,
  HourScore,
  HourlyWeather,
  MarineHourly,
  Spot,
  SpotResult,
  SpotWeather,
} from '../types'
import { SPECIES } from '../data/species'

/** Hand-set weights, version 0. Sum is 100. `waves` replaces `water` on
 *  sea spots and reuses its weight. To be refit on real catch reports. */
export const WEIGHTS: Record<FactorKey, number> = {
  pressureTrend: 20,
  pressureLevel: 5,
  waterTemp: 15,
  wind: 10,
  light: 10,
  water: 10,
  waves: 10,
  timeOfDay: 20,
  moon: 5,
  season: 5,
}

export const MODEL_VERSION = 'v0.2'
/** Hours scored ahead. The 48 h strip shows the first 48; the trip planner
 *  uses up to 72 to cover the day after tomorrow. */
export const HOURS_AHEAD = 72

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export function bandOf(score: number | undefined): Band {
  if (score === undefined || Number.isNaN(score)) return 'none'
  if (score >= 82) return 'great'
  if (score >= 68) return 'good'
  if (score >= 52) return 'ok'
  if (score >= 35) return 'slow'
  return 'dead'
}

/** Index of the first hourly entry at or after the current hour. */
export function nowIndex(hourly: HourlyWeather[], now = new Date()): number {
  const floor = new Date(now)
  floor.setUTCMinutes(0, 0, 0)
  const idx = hourly.findIndex((h) => h.time.getTime() >= floor.getTime())
  return idx === -1 ? hourly.length - 1 : idx
}

/**
 * Water temperature estimate from the mean air temperature of the last
 * 7 days, damped by depth class. Always labeled as an estimate in the UI.
 */
export function estimateWaterTemp(spot: Spot, hourly: HourlyWeather[], idx: number): number {
  const from = Math.max(0, idx - 24 * 7)
  const slice = hourly.slice(from, idx)
  if (slice.length === 0) return hourly[idx]?.temp ?? 15
  const mean = slice.reduce((a, h) => a + h.temp, 0) / slice.length
  switch (spot.depth) {
    case 'shallow':
      return 0.85 * mean + 2
    case 'medium':
      return 0.8 * mean + 1.5
    case 'deep':
      return 0.72 * mean + 1
    case 'river':
      return 0.7 * mean + 1
    case 'sea':
      return 0.9 * mean + 3
  }
}

/** Nearest non-null sea surface temperature at or before idx. */
function measuredSst(marine: MarineHourly[] | undefined, time: Date): number | null {
  if (!marine || marine.length === 0) return null
  let best: MarineHourly | null = null
  for (const m of marine) {
    if (m.time.getTime() <= time.getTime() && m.sst !== null) best = m
    if (m.time.getTime() > time.getTime()) break
  }
  return best?.sst ?? null
}

function waveAt(marine: MarineHourly[] | undefined, time: Date): number | null {
  if (!marine) return null
  const m = marine.find((x) => x.time.getTime() === time.getTime())
  return m?.waveHeight ?? null
}

function speciesShares(spot: Spot): Array<[keyof typeof SPECIES, number]> {
  const entries = Object.entries(spot.species) as Array<[keyof typeof SPECIES, number]>
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1
  return entries.map(([k, v]) => [k, v / total])
}

function pressureTrendFactor(hourly: HourlyWeather[], i: number): FactorResult {
  const back = Math.max(0, i - 6)
  const delta = hourly[i].pressure - hourly[back].pressure
  let value: number
  let state: string
  if (Math.abs(delta) <= 1) {
    value = 1
    state = 'stable'
  } else if (delta < 0 && delta >= -3) {
    value = 0.8
    state = 'falling'
  } else if (delta < -3) {
    value = 0.5
    state = 'fallingFast'
  } else if (delta <= 3) {
    value = 0.6
    state = 'rising'
  } else {
    value = 0.3
    state = 'risingFast'
  }
  return { key: 'pressureTrend', weight: WEIGHTS.pressureTrend, value, raw: delta, unit: 'hPa', state }
}

function pressureLevelFactor(h: HourlyWeather): FactorResult {
  const p = h.pressure
  let value: number
  if (p >= 1010 && p <= 1020) value = 1
  else {
    const dist = p < 1010 ? 1010 - p : p - 1020
    value = clamp01(1 - (dist / 15) * 0.7)
  }
  return { key: 'pressureLevel', weight: WEIGHTS.pressureLevel, value, raw: p, unit: 'hPa' }
}

function waterTempFactor(spot: Spot, tw: number, estimated: boolean): FactorResult {
  let value = 0
  for (const [id, share] of speciesShares(spot)) {
    const sp = SPECIES[id]
    const mid = (sp.tempMin + sp.tempMax) / 2
    const sigma = (sp.tempMax - sp.tempMin) / 2 || 3
    value += share * Math.exp(-0.5 * ((tw - mid) / sigma) ** 2)
  }
  return {
    key: 'waterTemp',
    weight: WEIGHTS.waterTemp,
    value: clamp01(value),
    raw: tw,
    unit: '°C',
    estimated,
  }
}

function windFactor(h: HourlyWeather): FactorResult {
  const w = h.wind
  let value: number
  let state: string
  if (w < 5) {
    value = 0.7
    state = 'calm'
  } else if (w <= 15) {
    value = 1
    state = 'light'
  } else if (w <= 30) {
    value = 1 - ((w - 15) / 15) * 0.6
    state = 'moderate'
  } else {
    value = 0.2
    state = 'strong'
  }
  return { key: 'wind', weight: WEIGHTS.wind, value, raw: w, unit: 'km/h', state }
}

function lightFactor(h: HourlyWeather, isDay: boolean): FactorResult {
  let value: number
  let state: string
  if (!isDay) {
    value = 0.8
    state = 'night'
  } else {
    value = 0.3 + 0.7 * (h.cloud / 100)
    state = h.cloud >= 70 ? 'overcast' : h.cloud >= 30 ? 'partlyCloudy' : 'sunny'
  }
  return { key: 'light', weight: WEIGHTS.light, value, raw: h.cloud, unit: '%', state }
}

/**
 * Water level / clarity proxy. Until river gauges are connected this is
 * derived from rainfall in the last 48 hours: heavy rain means rising,
 * muddy water. Labeled as estimated.
 */
function waterFactor(hourly: HourlyWeather[], i: number): FactorResult {
  const from = Math.max(0, i - 48)
  let rain = 0
  for (let k = from; k < i; k++) rain += hourly[k].precip
  let value: number
  let state: string
  if (rain > 20) {
    value = 0.2
    state = 'rising'
  } else if (rain > 5) {
    value = 0.6
    state = 'unsettled'
  } else {
    value = 1
    state = 'stable'
  }
  return { key: 'water', weight: WEIGHTS.water, value, raw: rain, unit: 'mm', state, estimated: true }
}

/** Sea spots: measured wave height. Null data falls back to a labeled estimate. */
function wavesFactor(marine: MarineHourly[] | undefined, time: Date): FactorResult {
  const wh = waveAt(marine, time)
  if (wh === null) {
    return { key: 'waves', weight: WEIGHTS.waves, value: 0.7, raw: 0, unit: 'm', state: 'choppy', estimated: true }
  }
  let value: number
  let state: string
  if (wh < 0.5) {
    value = 1
    state = 'flat'
  } else if (wh <= 1.2) {
    value = 0.7
    state = 'choppy'
  } else {
    value = 0.25
    state = 'rough'
  }
  return { key: 'waves', weight: WEIGHTS.waves, value, raw: wh, unit: 'm', state }
}

function timeOfDayFactor(spot: Spot, t: Date, isDay: boolean, sunrise: Date, sunset: Date): FactorResult {
  const minutesTo = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60000
  const dist = Math.min(minutesTo(t, sunrise), minutesTo(t, sunset))
  let value: number
  let state: string
  if (dist <= 60) {
    value = 1
    state = 'goldenHour'
  } else if (dist <= 180) {
    value = 0.7
    state = 'nearGolden'
  } else if (isDay) {
    value = 0.25
    state = 'midday'
  } else {
    // Night: baseline 0.5, lifted by the share of nocturnal species.
    const nocturnal = speciesShares(spot)
      .filter(([id]) => SPECIES[id].nocturnal)
      .reduce((a, [, s]) => a + s, 0)
    value = 0.5 + 0.4 * nocturnal
    state = 'night'
  }
  return { key: 'timeOfDay', weight: WEIGHTS.timeOfDay, value, raw: dist, unit: 'min', state }
}

function moonFactor(t: Date): FactorResult {
  const phase = SunCalc.getMoonIllumination(t).phase // 0 new, 0.5 full
  const dist = Math.min(phase, Math.abs(phase - 0.5), 1 - phase) // 0..0.25
  const value = 1 - 1.6 * dist
  const state = phase < 0.07 || phase > 0.93 ? 'new' : Math.abs(phase - 0.5) < 0.07 ? 'full' : 'quarter'
  return { key: 'moon', weight: WEIGHTS.moon, value, raw: Math.round(phase * 100), unit: '%', state }
}

function seasonFactor(spot: Spot, t: Date): FactorResult {
  const month = t.getUTCMonth() + 1
  let value = 0
  for (const [id, share] of speciesShares(spot)) {
    value += share * (SPECIES[id].months.includes(month) ? 1 : 0.3)
  }
  const v = clamp01(value)
  return { key: 'season', weight: WEIGHTS.season, value: v, raw: month, unit: '', state: v >= 0.65 ? 'inSeason' : 'offSeason' }
}

export interface ScoreOptions {
  /** A barometer reading typed by the user, hPa. Shifts the whole pressure
   *  series so the trend from the forecast is preserved but the level is
   *  corrected to the measured value. */
  manualPressure?: number
  now?: Date
}

export function scoreHour(
  spot: Spot,
  hourly: HourlyWeather[],
  marine: MarineHourly[] | undefined,
  i: number,
  tw: number,
  twEstimated: boolean,
): HourScore {
  const h = hourly[i]
  const times = SunCalc.getTimes(h.time, spot.lat, spot.lon)
  // Georgia has no polar days, but the types allow null; fall back to a
  // 06:00–18:00 local day so scoring never crashes.
  const dayStart = new Date(h.time)
  dayStart.setUTCHours(2, 0, 0, 0) // 06:00 Tbilisi
  const sunrise = times.sunrise ?? dayStart
  const sunset = times.sunset ?? new Date(dayStart.getTime() + 12 * 3600000)
  const isDay = h.time >= sunrise && h.time <= sunset
  const isSea = spot.type === 'sea'
  const factors: FactorResult[] = [
    pressureTrendFactor(hourly, i),
    pressureLevelFactor(h),
    waterTempFactor(spot, tw, twEstimated),
    windFactor(h),
    lightFactor(h, isDay),
    isSea ? wavesFactor(marine, h.time) : waterFactor(hourly, i),
    timeOfDayFactor(spot, h.time, isDay, sunrise, sunset),
    moonFactor(h.time),
    seasonFactor(spot, h.time),
  ]
  let rainPenalty = 1
  let recent = 0
  for (let k = Math.max(0, i - 3); k <= i; k++) recent += hourly[k].precip
  if (recent > 5) rainPenalty = 0.6
  const raw = factors.reduce((a, f) => a + f.weight * f.value, 0)
  const score = Math.round(raw * rainPenalty)
  return { time: h.time, score, factors }
}

export function scoreSpot(spot: Spot, weather: SpotWeather, opts: ScoreOptions = {}): SpotResult {
  const now = opts.now ?? new Date()
  let hourly = weather.hourly
  const idx = nowIndex(hourly, now)

  if (opts.manualPressure !== undefined && hourly[idx]) {
    const offset = opts.manualPressure - hourly[idx].pressure
    hourly = hourly.map((h) => ({ ...h, pressure: h.pressure + offset }))
  }

  let tw: number
  let twEstimated: boolean
  const sst = spot.type === 'sea' ? measuredSst(weather.marine, hourly[idx]?.time ?? now) : null
  if (sst !== null) {
    tw = sst
    twEstimated = false
  } else {
    tw = estimateWaterTemp(spot, hourly, idx)
    twEstimated = true
  }

  const hours: HourScore[] = []
  for (let i = idx; i < Math.min(hourly.length, idx + HOURS_AHEAD); i++) {
    hours.push(scoreHour(spot, hourly, weather.marine, i, tw, twEstimated))
  }

  const ageHours = (now.getTime() - weather.fetchedAt.getTime()) / 3600000
  // No community reports or gauge data yet, so confidence tops out at medium.
  const confidence: Confidence = ageHours <= 3 ? 'medium' : 'low'
  return { spotId: spot.id, hours, waterTemp: tw, waterTempEstimated: twEstimated, confidence, fetchedAt: weather.fetchedAt }
}

/** Points per unit of mean report activity. Spec section 5.4. */
export const COMMUNITY_K = 5
const COMMUNITY_HALF_LIFE_H = 48
const COMMUNITY_CLAMP = 15

/** Decay-weighted mean of recent reports, turned into a score delta. */
export function communityAdjustment(reports: Report[], now = new Date()): CommunityAdjustment | null {
  if (reports.length === 0) return null
  let wsum = 0
  let sum = 0
  for (const r of reports) {
    const ageH = Math.max(0, (now.getTime() - r.createdAt.getTime()) / 3600000)
    const w = Math.pow(0.5, ageH / COMMUNITY_HALF_LIFE_H)
    wsum += w
    sum += w * r.activity
  }
  if (wsum === 0) return null
  const mean = sum / wsum
  const delta = Math.round(Math.max(-COMMUNITY_CLAMP, Math.min(COMMUNITY_CLAMP, COMMUNITY_K * mean)))
  return { delta, count: reports.length }
}

/** Apply the community correction to every hour and raise confidence when
 *  there are enough reports. The only ground truth the model has. */
export function applyCommunity(result: SpotResult, reports: Report[], now = new Date()): SpotResult {
  const adj = communityAdjustment(reports, now)
  if (!adj) return result
  const hours = result.hours.map((h) => ({ ...h, score: Math.max(0, Math.min(100, h.score + adj.delta)) }))
  const confidence: Confidence =
    adj.count >= 3 && result.confidence === 'medium' ? 'high' : result.confidence
  return { ...result, hours, confidence, community: adj }
}

/** Best contiguous window of `len` hours within the next 24 hours. */
export function bestWindow(hours: HourScore[], len = 3): { start: Date; end: Date; avg: number } | null {
  const horizon = hours.slice(0, 24)
  if (horizon.length < len) return null
  let best = -1
  let bestI = 0
  for (let i = 0; i + len <= horizon.length; i++) {
    let sum = 0
    for (let k = 0; k < len; k++) sum += horizon[i + k].score
    if (sum > best) {
      best = sum
      bestI = i
    }
  }
  const start = horizon[bestI].time
  const end = new Date(horizon[bestI + len - 1].time.getTime() + 3600000)
  return { start, end, avg: Math.round(best / len) }
}

/** The weakest factor, used for the one-line summary hint. */
export function weakestFactor(h: HourScore): FactorResult | null {
  const sorted = [...h.factors].sort((a, b) => a.value - b.value)
  const w = sorted[0]
  return w && w.value < 0.6 ? w : null
}
