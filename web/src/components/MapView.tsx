import { useEffect, useRef } from 'react'
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
  type LayerSpecification,
  type SourceSpecification,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre resolves its worker as `new URL(<dynamic name>, import.meta.url)`,
// which Vite cannot trace, so production builds never emit the file and the
// map silently renders nothing (dev works because node_modules is served
// directly). Bundle the worker explicitly and point MapLibre at it.
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { Spot, SpotResult } from '../types'
import { GEORGIA_BOUNDS } from '../data/spots'
import { bandOf } from '../lib/scoring'
import { MapRoot, Controls, ZoomGroup } from './MapView.styles'
import { CtlBtn } from '../styles/shared'
import { useOrigin } from '../lib/origin'
import { useTranslation } from 'react-i18next'
import { LABEL_LAYER, layerDef, type LayerDef, type MapLayer, type RasterLayer } from '../lib/mapLayer'

setWorkerUrl(mapWorkerUrl)

function vectorStyleUrl(id: MapLayer): string {
  const def = layerDef(id)
  return def.kind === 'vector' ? def.style : vectorStyleUrl(LABEL_LAYER)
}

function rasterSource(def: RasterLayer): SourceSpecification {
  return {
    type: 'raster',
    tiles: def.tiles,
    tileSize: def.tileSize ?? 256,
    maxzoom: def.maxzoom,
    attribution: def.attribution,
  }
}

let labelStyle: Promise<StyleSpecification> | null = null

/** The vector style whose symbol layers get drawn over imagery. Fetched once. */
function loadLabelStyle(): Promise<StyleSpecification> {
  labelStyle ??= fetch(vectorStyleUrl(LABEL_LAYER))
    .then((r) => {
      if (!r.ok) throw new Error(`style ${r.status}`)
      return r.json() as Promise<StyleSpecification>
    })
    .catch((e) => {
      labelStyle = null
      throw e
    })
  return labelStyle
}

/** Resolve a layer definition to something map.setStyle accepts. Raster maps
 *  become a one-layer style; imagery with `labels` also gets the label
 *  style's symbol layers on top so place and water names stay readable. */
async function styleFor(def: LayerDef): Promise<string | StyleSpecification> {
  if (def.kind === 'vector') return def.style
  const raster: LayerSpecification = { id: 'base', type: 'raster', source: 'base' }
  if (!def.labels) {
    return { version: 8, sources: { base: rasterSource(def) }, layers: [raster] }
  }
  const base = await loadLabelStyle()
  return {
    ...base,
    sources: { ...base.sources, base: rasterSource(def) },
    layers: [raster, ...base.layers.filter((l) => l.type === 'symbol')],
  }
}

/** Bubbles closer than this many screen pixels collapse into one cluster. */
const CLUSTER_PX = 46

interface Props {
  spots: Spot[]
  results: Record<string, SpotResult>
  /** Base map to show; changing it swaps the style, markers stay put. */
  layer: MapLayer
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Fires once the style has loaded and the first frame rendered. */
  onReady?: () => void
  /** Desktop: slide the map controls left of the open detail panel. */
  shiftControls?: boolean
}

interface Entry {
  spot: Spot
  marker: Marker
  bubble: HTMLButtonElement
}

function makeBubble(type: string, label: string): { wrap: HTMLDivElement; bubble: HTMLButtonElement } {
  const wrap = document.createElement('div')
  wrap.className = 'marker'
  const bubble = document.createElement('button')
  bubble.type = 'button'
  bubble.className = 'bubble'
  bubble.dataset.type = type
  bubble.dataset.band = 'none'
  bubble.textContent = '·'
  bubble.setAttribute('aria-label', label)
  wrap.appendChild(bubble)
  return { wrap, bubble }
}

export function MapView({ spots, results, layer, selectedId, onSelect, onReady, shiftControls }: Props) {
  const { t } = useTranslation()
  const { origin, locating, locate } = useOrigin()
  const userMarker = useRef<Marker | null>(null)
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const appliedLayer = useRef<MapLayer | null>(null)
  const entries = useRef<Map<string, Entry>>(new Map())
  const clusterMarkers = useRef<Marker[]>([])
  const resultsRef = useRef(results)
  const onSelectRef = useRef(onSelect)
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    onSelectRef.current = onSelect
    onReadyRef.current = onReady
  }, [onSelect, onReady])

  useEffect(() => {
    resultsRef.current = results
  }, [results])

  /** Greedy screen-space clustering; hides member bubbles, shows one per group. */
  const recluster = () => {
    const map = mapRef.current
    if (!map) return
    for (const m of clusterMarkers.current) m.remove()
    clusterMarkers.current = []

    type Pt = { entry: Entry; x: number; y: number }
    const pts: Pt[] = [...entries.current.values()].map((entry) => {
      const p = map.project([entry.spot.lon, entry.spot.lat])
      return { entry, x: p.x, y: p.y }
    })
    const clusters: Pt[][] = []
    for (const pt of pts) {
      const hit = clusters.find((c) => Math.hypot(c[0].x - pt.x, c[0].y - pt.y) < CLUSTER_PX)
      if (hit) hit.push(pt)
      else clusters.push([pt])
    }

    for (const c of clusters) {
      const single = c.length === 1
      for (const { entry } of c) entry.marker.getElement().style.display = single ? '' : 'none'
      if (single) continue

      let best = -1
      let lon = 0
      let lat = 0
      for (const { entry } of c) {
        const s = resultsRef.current[entry.spot.id]?.hours[0]?.score
        if (s !== undefined && s > best) best = s
        lon += entry.spot.lon
        lat += entry.spot.lat
      }
      lon /= c.length
      lat /= c.length

      const { wrap, bubble } = makeBubble('cluster', `${c.length} spots`)
      bubble.classList.add('cluster')
      bubble.dataset.band = bandOf(best === -1 ? undefined : best)
      bubble.textContent = best === -1 ? '·' : String(best)
      const count = document.createElement('small')
      count.textContent = String(c.length)
      bubble.appendChild(count)
      bubble.addEventListener('click', (e) => {
        e.stopPropagation()
        const b = new LngLatBounds()
        for (const { entry } of c) b.extend([entry.spot.lon, entry.spot.lat])
        map.fitBounds(b, { padding: 90, maxZoom: 12, duration: 700 })
      })
      const marker = new Marker({ element: wrap, anchor: 'center' }).setLngLat([lon, lat]).addTo(map)
      clusterMarkers.current.push(marker)
    }
  }

  // Create the map once.
  useEffect(() => {
    if (!container.current || mapRef.current) return
    // Raster layers need a built style object; start from a vector style and
    // let the layer effect swap the real one in.
    const initial: MapLayer = layerDef(layer).kind === 'vector' ? layer : LABEL_LAYER
    appliedLayer.current = initial
    const map = new MapLibreMap({
      container: container.current,
      style: vectorStyleUrl(initial),
      bounds: GEORGIA_BOUNDS,
      fitBoundsOptions: { padding: { top: 120, bottom: 60, left: 30, right: 30 } },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    })
    map.touchZoomRotate.disableRotation()
    map.on('click', () => onSelectRef.current(null))
    map.on('moveend', recluster)
    map.on('load', () => {
      recluster()
      map.once('idle', () => onReadyRef.current?.())
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      appliedLayer.current = null
      entries.current.clear()
      clusterMarkers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap the base style when the layer changes. Markers are DOM elements
  // owned by MapLibre, so they survive setStyle.
  useEffect(() => {
    const map = mapRef.current
    if (!map || appliedLayer.current === layer) return
    appliedLayer.current = layer
    if (container.current) container.current.dataset.layer = layer
    styleFor(layerDef(layer))
      .then((style) => {
        if (mapRef.current === map && appliedLayer.current === layer) map.setStyle(style)
      })
      .catch(() => {
        // style unavailable; keep whatever is showing
      })
  }, [layer])

  // Sync markers with the spot list (seed spots plus approved paid ponds).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const wanted = new Set(spots.map((s) => s.id))
    for (const [id, e] of entries.current) {
      if (!wanted.has(id)) {
        e.marker.remove()
        entries.current.delete(id)
      }
    }
    for (const s of spots) {
      if (entries.current.has(s.id)) continue
      const { wrap, bubble } = makeBubble(s.type, s.nameEn)
      bubble.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current(s.id)
      })
      const marker = new Marker({ element: wrap, anchor: 'center' }).setLngLat([s.lon, s.lat]).addTo(map)
      entries.current.set(s.id, { spot: s, marker, bubble })
    }
    recluster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots])

  // Update bubble numbers and colors when results change.
  useEffect(() => {
    for (const [id, { bubble }] of entries.current) {
      const score = results[id]?.hours[0]?.score
      bubble.dataset.band = bandOf(score)
      bubble.textContent = score === undefined ? '·' : String(score)
    }
    recluster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

  // Highlight the selection and fly to it.
  useEffect(() => {
    for (const [id, { bubble }] of entries.current) {
      bubble.classList.toggle('selected', id === selectedId)
      bubble.classList.toggle('dim', selectedId !== null && id !== selectedId)
    }
    const map = mapRef.current
    if (!map || !selectedId) return
    const spot = entries.current.get(selectedId)?.spot
    if (!spot) return
    map.flyTo({
      center: [spot.lon, spot.lat],
      zoom: Math.max(map.getZoom(), 10.5),
      offset: [0, -Math.round(window.innerHeight * 0.18)],
      duration: 900,
      essential: true,
    })
  }, [selectedId])

  // Blue dot once the user has shared their position.
  useEffect(() => {
    const map = mapRef.current
    if (!map || origin.source !== 'user') return
    if (!userMarker.current) {
      const el = document.createElement('div')
      el.setAttribute('data-user-dot', '')
      // Position must be set before addTo, or MapLibre reads an undefined LngLat.
      userMarker.current = new Marker({ element: el, anchor: 'center' }).setLngLat([origin.lon, origin.lat]).addTo(map)
    } else {
      userMarker.current.setLngLat([origin.lon, origin.lat])
    }
  }, [origin])

  const fitGeorgia = () =>
    mapRef.current?.fitBounds(GEORGIA_BOUNDS, { padding: { top: 120, bottom: 60, left: 30, right: 30 }, duration: 700 })

  const flyToUser = async () => {
    const o = origin.source === 'user' ? origin : await locate()
    if (o) mapRef.current?.flyTo({ center: [o.lon, o.lat], zoom: Math.max(mapRef.current.getZoom(), 10), duration: 900 })
  }

  return (
    <>
      <MapRoot ref={container} data-layer={layer} data-keep-colors={layerDef(layer).keepColors || undefined} />
      <Controls $shift={shiftControls} aria-label={t('map.controls')}>
        <ZoomGroup>
          <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label={t('map.zoomIn')} title={t('map.zoomIn')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label={t('map.zoomOut')} title={t('map.zoomOut')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>
        </ZoomGroup>
        <CtlBtn type="button" onClick={() => void flyToUser()} aria-label={t('map.locate')} title={t('map.locate')} aria-busy={locating}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </CtlBtn>
        <CtlBtn type="button" onClick={fitGeorgia} aria-label={t('map.fitAll')} title={t('map.fitAll')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </CtlBtn>
      </Controls>
    </>
  )
}
