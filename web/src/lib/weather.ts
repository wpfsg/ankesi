import type { HourlyWeather, Spot, SpotWeather } from '../types'

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

/**
 * Fetch hourly weather for all spots in one request. Open-Meteo accepts
 * comma-separated coordinate lists and returns one object per location in
 * the same order. Times are requested in UTC and parsed as absolute
 * instants so the browser's own timezone does not matter.
 */
export async function fetchWeatherForSpots(spots: Spot[]): Promise<SpotWeather[]> {
  const params = new URLSearchParams({
    latitude: spots.map((s) => s.lat.toFixed(4)).join(','),
    longitude: spots.map((s) => s.lon.toFixed(4)).join(','),
    hourly: [
      'temperature_2m',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'cloud_cover',
      'precipitation',
    ].join(','),
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'UTC',
  })

  const res = await fetch(`${API}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Open-Meteo responded ${res.status}`)
  }
  const json = (await res.json()) as OpenMeteoResponse | OpenMeteoResponse[]
  const list = Array.isArray(json) ? json : [json]
  const fetchedAt = new Date()

  return list.map((entry, i) => ({
    spotId: spots[i].id,
    hourly: toHourly(entry.hourly),
    fetchedAt,
  }))
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
