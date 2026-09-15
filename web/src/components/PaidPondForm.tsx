import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Region } from '../types'
import { SPOTS } from '../data/spots'
import { haversineKm } from '../lib/format'
import { submitPond } from '../lib/db'
import { ModalSheet } from './ModalSheet'

interface Props {
  userId: string
  onClose: () => void
  onSubmitted: () => void
}

/** Region of the nearest seeded spot. Good enough for a moderator to fix. */
function nearestRegion(lat: number, lon: number): Region {
  let best: Region = 'tbilisi'
  let bestD = Infinity
  for (const s of SPOTS) {
    const d = haversineKm(lat, lon, s.lat, s.lon)
    if (d < bestD) {
      bestD = d
      best = s.region
    }
  }
  return best
}

export function PaidPondForm({ userId, onClose, onSubmitted }: Props) {
  const { t } = useTranslation()
  const [nameKa, setNameKa] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [fee, setFee] = useState('')
  const [contact, setContact] = useState('')
  const [hours, setHours] = useState('')
  const [accessKa, setAccessKa] = useState('')
  const [accessEn, setAccessEn] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(5))
        setLon(p.coords.longitude.toFixed(5))
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const latN = parseFloat(lat)
  const lonN = parseFloat(lon)
  const valid =
    nameKa.trim().length > 1 &&
    nameEn.trim().length > 1 &&
    Number.isFinite(latN) &&
    Number.isFinite(lonN) &&
    latN >= 40 &&
    latN <= 44 &&
    lonN >= 39.5 &&
    lonN <= 47

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      await submitPond({
        nameKa,
        nameEn,
        lat: latN,
        lon: lonN,
        region: nearestRegion(latN, lonN),
        feeGel: fee ? parseFloat(fee) : undefined,
        contact,
        hours,
        accessKa,
        accessEn,
        userId,
      })
      setDone(true)
      onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalSheet title={t('pond.title')} onClose={onClose}>
      {done ? (
        <div className="notice">{t('pond.pending')}</div>
      ) : (
        <>
          <p className="muted" style={{ margin: 0 }}>
            {t('pond.intro')}
          </p>
          <div className="grid2">
            <div>
              <label className="label" htmlFor="pnka">
                {t('pond.nameKa')}
              </label>
              <input id="pnka" className="input" maxLength={80} value={nameKa} onChange={(e) => setNameKa(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="pnen">
                {t('pond.nameEn')}
              </label>
              <input id="pnen" className="input" maxLength={80} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
          </div>

          <div>
            <span className="label">{t('pond.location')}</span>
            <div className="grid2">
              <input className="input" placeholder={t('pond.lat')} inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
              <input className="input" placeholder={t('pond.lon')} inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} />
            </div>
            <button type="button" className="btn" style={{ marginTop: 8 }} onClick={locate}>
              {t('pond.useLocation')}
            </button>
            <div className="muted" style={{ marginTop: 6 }}>
              {t('pond.locationHint')}
            </div>
          </div>

          <div className="grid2">
            <div>
              <label className="label" htmlFor="pfee">
                {t('pond.fee')}
              </label>
              <input id="pfee" className="input" type="number" inputMode="decimal" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="phours">
                {t('pond.hours')}
              </label>
              <input id="phours" className="input" maxLength={80} value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="pcontact">
              {t('pond.contact')}
            </label>
            <input id="pcontact" className="input" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="packa">
              {t('pond.accessKa')} · {t('common.optional')}
            </label>
            <textarea id="packa" className="textarea" maxLength={500} value={accessKa} onChange={(e) => setAccessKa(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pacen">
              {t('pond.accessEn')} · {t('common.optional')}
            </label>
            <textarea id="pacen" className="textarea" maxLength={500} value={accessEn} onChange={(e) => setAccessEn(e.target.value)} />
          </div>

          {error && <div className="notice warn">{error}</div>}

          <button type="button" className="btn accent block" disabled={busy || !valid} onClick={() => void submit()}>
            {busy ? t('pond.submitting') : t('pond.submit')}
          </button>
        </>
      )}
    </ModalSheet>
  )
}
