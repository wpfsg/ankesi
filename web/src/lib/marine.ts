import type { MarineHourly, Spot } from '../types'
import { FORECAST_DAYS, PAST_DAYS } from './weather'
import { ForecastCache, checkResponse, serialized } from './forecastCache'

const API = 'https://marine-api.open-meteo.com/v1/marine'

interface MarineResponse {
  hourly: {
    time: string[]
    wave_height: (number | null)[]
    sea_surface_temperature: (number | null)[]
  }
}

type MarineHourlyRaw = MarineResponse['hourly']

const cache = new ForecastCache<MarineHourlyRaw>('ankesi.marine.v1', `${PAST_DAYS}/${FORECAST_DAYS}`)

/**
 * Wave height and sea surface temperature for sea spots, one request for
 * every spot the cache lacks. Uses each spot's offshore marine coordinate so
 * the grid cell is water. Returns spotId -> hourly series; missing data
 * stays null and the scoring falls back to labeled estimates. Stale cached
 * series are used when the provider refuses.
 */
export const fetchMarineForSpots = serialized(fetchMarineForSpotsNow)

async function fetchMarineForSpotsNow(spots: Spot[]): Promise<Record<string, MarineHourly[]>> {
  const sea = spots.filter((s) => s.type === 'sea')
  if (sea.length === 0) return {}
  const now = Date.now()
  const out: Record<string, MarineHourly[]> = {}
  const missing: Spot[] = []
  for (const s of sea) {
    const hit = cache.fresh(s.id, now)
    if (hit) out[s.id] = toSeries(hit.data)
    else missing.push(s)
  }
  if (missing.length === 0) return out

  try {
    const params = new URLSearchParams({
      latitude: missing.map((s) => (s.marineLat ?? s.lat).toFixed(4)).join(','),
      longitude: missing.map((s) => (s.marineLon ?? s.lon).toFixed(4)).join(','),
      hourly: 'wave_height,sea_surface_temperature',
      past_days: String(PAST_DAYS),
      forecast_days: String(FORECAST_DAYS),
      timezone: 'UTC',
    })
    const res = await fetch(`${API}?${params.toString()}`)
    await checkResponse(res, 'Open-Meteo marine')
    const json = (await res.json()) as MarineResponse | MarineResponse[]
    const list = Array.isArray(json) ? json : [json]
    list.forEach((entry, i) => {
      cache.put(missing[i].id, entry.hourly, now)
      out[missing[i].id] = toSeries(entry.hourly)
    })
    cache.flush(now)
    return out
  } catch (e) {
    for (const s of missing) {
      const hit = cache.stale(s.id, now)
      if (!hit) throw e
      out[s.id] = toSeries(hit.data)
    }
    return out
  }
}

function toSeries(h: MarineHourlyRaw): MarineHourly[] {
  const series: MarineHourly[] = []
  for (let k = 0; k < h.time.length; k++) {
    series.push({
      time: new Date(`${h.time[k]}Z`),
      waveHeight: fin(h.wave_height[k]),
      sst: fin(h.sea_surface_temperature[k]),
    })
  }
  return series
}

function fin(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
