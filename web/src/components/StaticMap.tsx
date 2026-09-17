import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import type { Spot } from '../types'

const ZOOM = 12
const COLS = 3
const ROWS = 2

const Frame = styled.div`
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--ctl-bg-2);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
`

const Tiles = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(${COLS}, 1fr);
  grid-template-rows: repeat(${ROWS}, 1fr);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  :root[data-theme='dark'] & img {
    filter: invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.7);
  }
`

const Pin = styled.span`
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
`

const Credit = styled.span`
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 10px;
  color: var(--fg-2);
  background: var(--glass-bg);
  padding: 1px 6px;
  border-radius: 6px;

  a {
    color: inherit;
  }
`

function tileXY(lat: number, lon: number, z: number) {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y }
}

/** Six OpenStreetMap tiles around the spot with a pin: a map that costs no
 *  JavaScript. The interactive map is one click away. */
export function StaticMap({ spot }: { spot: Spot }) {
  const { t, i18n } = useTranslation()
  const { x, y } = tileXY(spot.lat, spot.lon, ZOOM)
  const tx = Math.floor(x)
  const ty = Math.floor(y)
  const fx = x - tx
  const fy = y - ty
  const firstCol = tx - 1
  const firstRow = fy < 0.5 ? ty - 1 : ty
  const left = ((tx - firstCol + fx) / COLS) * 100
  const top = ((ty - firstRow + fy) / ROWS) * 100
  const tiles: { col: number; row: number }[] = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) tiles.push({ col: firstCol + c, row: firstRow + r })
  const name = i18n.language === 'ka' ? spot.nameKa : spot.nameEn

  return (
    <Frame role="img" aria-label={t('spot.mapAlt', { name })}>
      <Tiles aria-hidden="true">
        {tiles.map(({ col, row }) => (
          <img
            key={`${col}-${row}`}
            src={`https://tile.openstreetmap.org/${ZOOM}/${col}/${row}.png`}
            alt=""
            loading="lazy"
            decoding="async"
            width="256"
            height="256"
          />
        ))}
      </Tiles>
      <Pin style={{ left: `${left}%`, top: `${top}%` }} aria-hidden="true" />
      <Credit>
        ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
      </Credit>
    </Frame>
  )
}
