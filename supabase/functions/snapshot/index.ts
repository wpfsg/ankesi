// Hourly weather snapshot. Reads approved spots, pulls Open-Meteo forecast
// and marine data, upserts into weather_hourly. Scheduled by pg_cron via
// pg_net (see ../../cron.sql.example). Deploy: `supabase functions deploy snapshot`.
// Secrets: CRON_SECRET (shared with the cron job). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'npm:@supabase/supabase-js@2'

interface SpotRow {
  id: string
  lat: number
  lon: number
  type: string
  marine_lat: number | null
  marine_lon: number | null
}

interface Row {
  spot_id: string
  ts: string
  temp: number | null
  pressure: number | null
  wind: number | null
  wind_dir: number | null
  cloud: number | null
  precip: number | null
  wave_height: number | null
  sst: number | null
}

const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const MARINE = 'https://marine-api.open-meteo.com/v1/marine'

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

Deno.serve(async (req) => {
  // The function runs with verify_jwt = false (pg_cron sends no JWT), so the
  // shared secret is the only gate. Refuse to run without one.
  const secret = Deno.env.get('CRON_SECRET')
  if (!secret) return new Response('CRON_SECRET is not set', { status: 500 })
  if (req.headers.get('x-cron-secret') !== secret) {
    return new Response('forbidden', { status: 403 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: spots, error } = await supabase
    .from('spots')
    .select('id, lat, lon, type, marine_lat, marine_lon')
    .eq('approved', true)
  if (error) return new Response(error.message, { status: 500 })
  const list = (spots ?? []) as SpotRow[]
  if (list.length === 0) return Response.json({ rows: 0 })

  // One forecast call for all spots: 1 day back, 2 ahead. Past hours refresh
  // toward observed values, forecast hours get corrected by later runs.
  const fp = new URLSearchParams({
    latitude: list.map((s) => s.lat.toFixed(4)).join(','),
    longitude: list.map((s) => s.lon.toFixed(4)).join(','),
    hourly: 'temperature_2m,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation',
    past_days: '1',
    forecast_days: '2',
    timezone: 'UTC',
  })
  const fres = await fetch(`${FORECAST}?${fp}`)
  if (!fres.ok) return new Response(`open-meteo ${fres.status}`, { status: 502 })
  const fjson = await fres.json()
  const farr = Array.isArray(fjson) ? fjson : [fjson]

  const rows = new Map<string, Row>()
  farr.forEach((entry, i) => {
    const h = entry.hourly
    const spot = list[i]
    for (let k = 0; k < h.time.length; k++) {
      const ts = `${h.time[k]}Z`
      rows.set(`${spot.id}|${ts}`, {
        spot_id: spot.id,
        ts,
        temp: num(h.temperature_2m[k]),
        pressure: num(h.pressure_msl[k]),
        wind: num(h.wind_speed_10m[k]),
        wind_dir: num(h.wind_direction_10m[k]),
        cloud: num(h.cloud_cover[k]),
        precip: num(h.precipitation[k]),
        wave_height: null,
        sst: null,
      })
    }
  })

  const sea = list.filter((s) => s.type === 'sea')
  if (sea.length > 0) {
    const mp = new URLSearchParams({
      latitude: sea.map((s) => (s.marine_lat ?? s.lat).toFixed(4)).join(','),
      longitude: sea.map((s) => (s.marine_lon ?? s.lon).toFixed(4)).join(','),
      hourly: 'wave_height,sea_surface_temperature',
      past_days: '1',
      forecast_days: '2',
      timezone: 'UTC',
    })
    const mres = await fetch(`${MARINE}?${mp}`)
    if (mres.ok) {
      const mjson = await mres.json()
      const marr = Array.isArray(mjson) ? mjson : [mjson]
      marr.forEach((entry, i) => {
        const h = entry.hourly
        const spot = sea[i]
        for (let k = 0; k < h.time.length; k++) {
          const key = `${spot.id}|${h.time[k]}Z`
          const row = rows.get(key)
          if (row) {
            row.wave_height = num(h.wave_height[k])
            row.sst = num(h.sea_surface_temperature[k])
          }
        }
      })
    }
  }

  const payload = [...rows.values()]
  const { error: upErr } = await supabase
    .from('weather_hourly')
    .upsert(payload, { onConflict: 'spot_id,ts' })
  if (upErr) return new Response(upErr.message, { status: 500 })

  return Response.json({ spots: list.length, rows: payload.length })
})
