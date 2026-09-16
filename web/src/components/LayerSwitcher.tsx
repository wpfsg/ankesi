import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAP_LAYERS, setLayer, useMapLayer } from '../lib/mapLayer'

/** Floating base-map picker (top right, below the header). */
export function LayerSwitcher() {
  const { t } = useTranslation()
  const layer = useMapLayer()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="layers">
      <button
        type="button"
        className="layers-btn glass"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('layers.title')}
        aria-expanded={open}
        aria-haspopup="menu"
        title={t('layers.title')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m12 3 9 5-9 5-9-5 9-5z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 16 9 5 9-5" />
        </svg>
      </button>
      {open && (
        <div className="layers-menu glass" role="menu" aria-label={t('layers.title')}>
          {MAP_LAYERS.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={layer === l}
              className="layers-option"
              data-layer={l}
              onClick={() => {
                setLayer(l)
                setOpen(false)
              }}
            >
              <span className="layers-swatch" aria-hidden="true" />
              {t(`layers.${l}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
