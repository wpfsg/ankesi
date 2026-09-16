import { useEffect, useState } from 'react'

/** Where distances are measured from: Tbilisi until the user shares their
 *  location. Shared by the planner, the detail panel and the map controls. */
export interface Origin {
  lat: number
  lon: number
  source: 'default' | 'user'
}

export const TBILISI: Origin = { lat: 41.7151, lon: 44.8271, source: 'default' }

const EVENT = 'ankesi:origin'
let current: Origin = TBILISI
let locating = false
let pending: Promise<Origin | null> | null = null

function emit() {
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function getOrigin(): Origin {
  return current
}

/** Ask the browser once; concurrent callers share the same request. */
export function locate(): Promise<Origin | null> {
  if (pending) return pending
  if (!('geolocation' in navigator)) return Promise.resolve(null)
  locating = true
  emit()
  pending = new Promise<Origin | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        current = { lat: p.coords.latitude, lon: p.coords.longitude, source: 'user' }
        locating = false
        pending = null
        emit()
        resolve(current)
      },
      () => {
        locating = false
        pending = null
        emit()
        resolve(null)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    )
  })
  return pending
}

export function useOrigin(): { origin: Origin; locating: boolean; locate: () => Promise<Origin | null> } {
  const [, tick] = useState(0)
  useEffect(() => {
    const on = () => tick((n) => n + 1)
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  return { origin: current, locating, locate }
}
