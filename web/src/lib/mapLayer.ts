import { useEffect, useState } from 'react'

/** Base maps offered in the side rail, in display order. */
export type MapLayer = 'satellite' | 'positron' | 'bright' | 'liberty' | 'osm'

interface Common {
  id: MapLayer
  /** Keep the map's own colours in the dark theme instead of inverting them
   *  (imagery, or styles the user picks because they are light). */
  keepColors?: boolean
}

export interface VectorLayer extends Common {
  kind: 'vector'
  /** MapLibre style URL. */
  style: string
}

export interface RasterLayer extends Common {
  kind: 'raster'
  tiles: string[]
  tileSize?: number
  maxzoom: number
  attribution: string
  /** Draw place and water labels from a vector style on top (imagery). */
  labels?: boolean
}

export type LayerDef = VectorLayer | RasterLayer

const OFM = 'https://tiles.openfreemap.org/styles/'

export const MAP_LAYERS: readonly LayerDef[] = [
  {
    id: 'satellite',
    kind: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    maxzoom: 19,
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    labels: true,
    keepColors: true,
  },
  { id: 'positron', kind: 'vector', style: OFM + 'positron' },
  { id: 'bright', kind: 'vector', style: OFM + 'bright', keepColors: true },
  { id: 'liberty', kind: 'vector', style: OFM + 'liberty' },
  {
    id: 'osm',
    kind: 'raster',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    maxzoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
]

export const DEFAULT_LAYER: MapLayer = 'positron'
/** Vector style whose label layers sit on top of imagery. */
export const LABEL_LAYER: MapLayer = 'positron'

const KEY = 'ankesi.mapLayer'
const EVENT = 'ankesi:mapLayer'

export function layerDef(id: MapLayer): LayerDef {
  return MAP_LAYERS.find((l) => l.id === id) ?? MAP_LAYERS[0]
}

function isLayer(v: unknown): v is MapLayer {
  return typeof v === 'string' && MAP_LAYERS.some((l) => l.id === v)
}

export function currentLayer(): MapLayer {
  try {
    const v = localStorage.getItem(KEY)
    return isLayer(v) ? v : DEFAULT_LAYER
  } catch {
    return DEFAULT_LAYER
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
