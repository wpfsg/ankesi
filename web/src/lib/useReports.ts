import { useSyncExternalStore } from 'react'
import type { Report } from '../types'
import { hasBackend } from './backend'

/** Recent community reports grouped by spot, loaded once per session when a
 *  backend exists. The database module is imported on demand so content
 *  pages do not ship supabase-js. */

export interface ReportsState {
  bySpot: Record<string, Report[]>
  all: Report[]
  ready: boolean
}

const EMPTY: ReportsState = { bySpot: {}, all: [], ready: !hasBackend }
let state = EMPTY
let started = false
const listeners = new Set<() => void>()

async function load() {
  try {
    const { fetchRecentReports } = await import('./db')
    const list = await fetchRecentReports()
    const bySpot: Record<string, Report[]> = {}
    for (const r of list) (bySpot[r.spotId] ??= []).push(r)
    state = { bySpot, all: list, ready: true }
  } catch {
    state = { ...state, ready: true }
  }
  for (const l of listeners) l()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  if (!started && hasBackend && typeof window !== 'undefined') {
    started = true
    void load()
  }
  return () => {
    listeners.delete(cb)
  }
}

export function useReports(): ReportsState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  )
}
