import type { HourlyWeather, Spot, SpotWeather } from '../types'
import { ForecastCache, checkResponse, serialized } from './forecastCache'

const API = 'https://api.open-meteo.com/v1/forecast'

/** Hours of history requested so pressure trends and water temperature
 *  estimates have enough context. 7 days. */
export const PAST_DAYS = 7
export const FORECAST_DAYS = 3

interface OpenMeteoHourly {
  time: string[]
  temperature_2m: (number | null)[]
  pressure_msl: (number | null)[]
  wind_speed_10m: (number | null)[]
  wind_direction_10m: (number | null)[]
  cloud_cover: (number | null)[]
  precipitation: (number | null)[]
}

interface OpenMeteoResponse {
  latitude: number
  longitude: number
  hourly: OpenMeteoHourly
}

const HOURLY = [
  'temperature_2m',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'cloud_cover',
  'precipitation',
]

const cache = new ForecastCache<OpenMeteoHourly>('ankesi.weather.v1', `${PAST_DAYS}/${FORECAST_DAYS}/${HOURLY.join(',')}`)

/**
 * Hourly weather for every spot. Locations with a fresh cached series are
 * served from localStorage; the rest go to Open-Meteo in one request
 * (comma-separated coordinates, one object per location in order). If the
 * request fails and every missing spot still has stale cached data, that
 * data is returned with `stale: true` instead of throwing. Times are UTC
 * instants, so the browser's timezone does not matter.
 */
export const fetchWeatherForSpots = serialized(fetchWeatherForSpotsNow)

async function fetchWeatherForSpotsNow(spots: Spot[]): Promise<SpotWeather[]> {
  const now = Date.now()
  const out: SpotWeather[] = []
  const missing: Spot[] = []
  for (const s of spots) {
    const hit = cache.fresh(s.id, now)
    if (hit) out.push({ spotId: s.id, hourly: toHourly(hit.data), fetchedAt: new Date(hit.fetchedAt) })
    else missing.push(s)
  }
  if (missing.length === 0) return out

  try {
    const list = await request(missing)
    const fetchedAt = new Date()
    list.forEach((entry, i) => {
      cache.put(missing[i].id, entry.hourly, fetchedAt.getTime())
      out.push({ spotId: missing[i].id, hourly: toHourly(entry.hourly), fetchedAt })
    })
    cache.flush(now)
    return out
  } catch (e) {
    // Fall back to whatever is still usable; surface the failure otherwise.
    const fallback: SpotWeather[] = []
    for (const s of missing) {
      const hit = cache.stale(s.id, now)
      if (!hit) throw e
      fallback.push({ spotId: s.id, hourly: toHourly(hit.data), fetchedAt: new Date(hit.fetchedAt), stale: true })
    }
    return [...out, ...fallback]
  }
}

async function request(spots: Spot[]): Promise<OpenMeteoResponse[]> {
  const params = new URLSearchParams({
    latitude: spots.map((s) => s.lat.toFixed(4)).join(','),
    longitude: spots.map((s) => s.lon.toFixed(4)).join(','),
    hourly: HOURLY.join(','),
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'UTC',
  })
  const res = await fetch(`${API}?${params.toString()}`)
  await checkResponse(res, 'Open-Meteo')
  const json = (await res.json()) as OpenMeteoResponse | OpenMeteoResponse[]
  return Array.isArray(json) ? json : [json]
}

function toHourly(h: OpenMeteoHourly): HourlyWeather[] {
  const out: HourlyWeather[] = []
  for (let i = 0; i < h.time.length; i++) {
    out.push({
      time: new Date(`${h.time[i]}Z`),
      temp: num(h.temperature_2m[i]),
      pressure: num(h.pressure_msl[i], 1013),
      wind: num(h.wind_speed_10m[i]),
      windDir: num(h.wind_direction_10m[i]),
      cloud: num(h.cloud_cover[i], 50),
      precip: num(h.precipitation[i]),
    })
  }
  return out
}

function num(v: number | null | undefined, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}
