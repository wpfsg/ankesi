import { createContext, useContext } from 'react'
import type { Band, Confidence, FactorResult, HourScore, SpotResult } from '../types'
import { bandOf, bestWindow } from './scoring'

/**
 * Build-time scores embedded in prerendered pages. The static HTML shows a
 * real score with its timestamp, the browser renders the same data first so
 * hydration matches, then refreshes live.
 */

export interface BestWindow {
  start: Date
  end: Date
  avg: number
}

export interface SpotSnapshot {
  score: number
  band: Band
  confidence: Confidence
  best: { start: string; end: string; avg: number } | null
  /** Hour scores for the strip; present on detail pages only. */
  hours?: { t: string; s: number }[]
  /** Current-hour factors; present on detail pages only. */
  factors?: FactorResult[]
  waterTemp?: number
  waterTempEstimated?: boolean
}

export interface Snapshot {
  generatedAt: string
  spots: Record<string, SpotSnapshot>
}

/** What content pages render for one spot, from either source. */
export interface SpotView {
  score?: number
  band: Band
  confidence: Confidence
  best: BestWindow | null
  hours: HourScore[]
  factors: FactorResult[]
  waterTemp?: number
  waterTempEstimated?: boolean
  fetchedAt: Date
  live: boolean
}

declare global {
  interface Window {
    __ANKESI_SNAPSHOT__?: Snapshot
  }
}

export function readSnapshot(): Snapshot | null {
  if (typeof window === 'undefined') return null
  return window.__ANKESI_SNAPSHOT__ ?? null
}

export function viewFromResult(r: SpotResult): SpotView {
  const now = r.hours[0]
  return {
    score: now?.score,
    band: bandOf(now?.score),
    confidence: r.confidence,
    best: bestWindow(r.hours),
    hours: r.hours,
    factors: now?.factors ?? [],
    waterTemp: r.waterTemp,
    waterTempEstimated: r.waterTempEstimated,
    fetchedAt: r.fetchedAt,
    live: true,
  }
}

export function viewFromSnapshot(s: SpotSnapshot, generatedAt: string): SpotView {
  return {
    score: s.score,
    band: s.band,
    confidence: s.confidence,
    best: s.best ? { start: new Date(s.best.start), end: new Date(s.best.end), avg: s.best.avg } : null,
    hours: (s.hours ?? []).map((h) => ({ time: new Date(h.t), score: h.s, factors: [] })),
    factors: s.factors ?? [],
    waterTemp: s.waterTemp,
    waterTempEstimated: s.waterTempEstimated,
    fetchedAt: new Date(generatedAt),
    live: false,
  }
}

export function emptyView(): SpotView {
  return { band: 'none', confidence: 'low', best: null, hours: [], factors: [], fetchedAt: new Date(0), live: false }
}

/** Compact entry for catalog pages. */
export function compactSnapshot(r: SpotResult): SpotSnapshot {
  const now = r.hours[0]
  const best = bestWindow(r.hours)
  return {
    score: now?.score ?? 0,
    band: bandOf(now?.score),
    confidence: r.confidence,
    best: best ? { start: best.start.toISOString(), end: best.end.toISOString(), avg: best.avg } : null,
  }
}

/** Full entry for one spot's page. */
export function detailSnapshot(r: SpotResult, hours = 48): SpotSnapshot {
  return {
    ...compactSnapshot(r),
    hours: r.hours.slice(0, hours).map((h) => ({ t: h.time.toISOString(), s: h.score })),
    factors: r.hours[0]?.factors ?? [],
    waterTemp: r.waterTemp,
    waterTempEstimated: r.waterTempEstimated,
  }
}

/** The snapshot for the current render: the prerenderer provides it per
 *  route, the browser reads it from the page. */
export const SnapshotContext = createContext<Snapshot | null>(null)

export function useSnapshot(): Snapshot | null {
  return useContext(SnapshotContext)
}
