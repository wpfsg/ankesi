import { useSyncExternalStore } from 'react'
import type { SpotResult, SpotWeather } from '../types'
import { SPOTS } from '../data/spots'
import { fetchWeatherForSpots } from './weather'
import { fetchMarineForSpots } from './marine'
import { scoreSpot } from './scoring'

/**
 * Live scores for content pages: one shared fetch for every seed spot,
 * refreshed hourly, cached in localStorage by the forecast cache the map
 * already uses. Pages render the build-time snapshot until this arrives.
 */

export interface LiveScores {
  results: Record<string, SpotResult> | null
  updatedAt?: Date
  error: boolean
}

const REFRESH_MS = 60 * 60 * 1000
const EMPTY: LiveScores = { results: null, error: false }

let state: LiveScores = EMPTY
let started = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

async function load() {
  try {
    const [rows, marine] = await Promise.all([
      fetchWeatherForSpots(SPOTS),
      fetchMarineForSpots(SPOTS).catch(() => ({}) as Record<string, never>),
    ])
    const now = new Date()
    const results: Record<string, SpotResult> = {}
    let updatedAt: Date | undefined
    for (const w of rows) {
      const spot = SPOTS.find((s) => s.id === w.spotId)
      if (!spot) continue
      const weather: SpotWeather = { ...w, marine: marine[w.spotId] }
      results[spot.id] = scoreSpot(spot, weather, { now })
      updatedAt = w.fetchedAt
    }
    state = { results, updatedAt, error: false }
  } catch {
    state = { ...state, error: true }
  }
  emit()
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  void load()
  window.setInterval(() => void load(), REFRESH_MS)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  start()
  return () => {
    listeners.delete(cb)
  }
}

export function useLiveScores(): LiveScores {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  )
}
