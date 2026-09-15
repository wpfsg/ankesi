import type { MarineHourly, Spot } from '../types'
import { FORECAST_DAYS, PAST_DAYS } from './weather'

const API = 'https://marine-api.open-meteo.com/v1/marine'

interface MarineResponse {
  hourly: {
    time: string[]
    wave_height: (number | null)[]
    sea_surface_temperature: (number | null)[]
  }
}

/**
 * Fetch wave height and sea surface temperature for sea spots in one call.
 * Uses each spot's offshore marine coordinate so the grid cell is water.
 * Returns a map of spotId -> hourly series. Missing data stays null and the
 * scoring falls back to labeled estimates.
 */
export async function fetchMarineForSpots(spots: Spot[]): Promise<Record<string, MarineHourly[]>> {
  const sea = spots.filter((s) => s.type === 'sea')
  if (sea.length === 0) return {}

  const params = new URLSearchParams({
    latitude: sea.map((s) => (s.marineLat ?? s.lat).toFixed(4)).join(','),
    longitude: sea.map((s) => (s.marineLon ?? s.lon).toFixed(4)).join(','),
    hourly: 'wave_height,sea_surface_temperature',
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'UTC',
  })

  const res = await fetch(`${API}?${params.toString()}`)
  if (!res.ok) throw new Error(`Open-Meteo marine responded ${res.status}`)
  const json = (await res.json()) as MarineResponse | MarineResponse[]
  const list = Array.isArray(json) ? json : [json]

  const out: Record<string, MarineHourly[]> = {}
  list.forEach((entry, i) => {
    const h = entry.hourly
    const series: MarineHourly[] = []
    for (let k = 0; k < h.time.length; k++) {
      series.push({
        time: new Date(`${h.time[k]}Z`),
        waveHeight: fin(h.wave_height[k]),
        sst: fin(h.sea_surface_temperature[k]),
      })
    }
    out[sea[i].id] = series
  })
  return out
}

function fin(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
