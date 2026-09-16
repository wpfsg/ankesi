import { useEffect, useState } from 'react'

/** Base map options: OpenFreeMap vector styles plus Esri satellite imagery. */
export const MAP_LAYERS = ['positron', 'bright', 'liberty', 'dark', 'fiord', 'satellite'] as const
export type MapLayer = (typeof MAP_LAYERS)[number]

const DEFAULT: MapLayer = 'positron'
const KEY = 'ankesi.mapLayer'
const EVENT = 'ankesi:mapLayer'

function isLayer(v: unknown): v is MapLayer {
  return typeof v === 'string' && (MAP_LAYERS as readonly string[]).includes(v)
}

export function currentLayer(): MapLayer {
  try {
    const v = localStorage.getItem(KEY)
    return isLayer(v) ? v : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function setLayer(layer: MapLayer) {
  try {
    localStorage.setItem(KEY, layer)
  } catch {
    // storage unavailable
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: layer }))
}

export function useMapLayer(): MapLayer {
  const [layer, set] = useState<MapLayer>(() => currentLayer())
  useEffect(() => {
    const on = (e: Event) => set((e as CustomEvent<MapLayer>).detail)
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  return layer
}
