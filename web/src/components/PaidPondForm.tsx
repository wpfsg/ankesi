import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Region } from '../types'
import { SPOTS } from '../data/spots'
import { haversineKm } from '../lib/format'
import { submitPond } from '../lib/db'
import { ModalSheet } from './ModalSheet'
import { Btn, Grid2, Input, Label, Muted, Notice, Textarea } from '../styles/shared'

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
        <Notice>{t('pond.pending')}</Notice>
      ) : (
        <>
          <Muted as="p" style={{ margin: 0 }}>
            {t('pond.intro')}
          </Muted>
          <Grid2>
            <div>
              <Label htmlFor="pnka">{t('pond.nameKa')}</Label>
              <Input id="pnka" maxLength={80} value={nameKa} onChange={(e) => setNameKa(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pnen">{t('pond.nameEn')}</Label>
              <Input id="pnen" maxLength={80} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
          </Grid2>

          <div>
            <Label as="span">{t('pond.location')}</Label>
            <Grid2>
              <Input placeholder={t('pond.lat')} inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
              <Input placeholder={t('pond.lon')} inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} />
            </Grid2>
            <Btn type="button" style={{ marginTop: 8 }} onClick={locate}>
              {t('pond.useLocation')}
            </Btn>
            <Muted style={{ marginTop: 6 }}>{t('pond.locationHint')}</Muted>
          </div>

          <Grid2>
            <div>
              <Label htmlFor="pfee">{t('pond.fee')}</Label>
              <Input id="pfee" type="number" inputMode="decimal" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phours">{t('pond.hours')}</Label>
              <Input id="phours" maxLength={80} value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </Grid2>

          <div>
            <Label htmlFor="pcontact">{t('pond.contact')}</Label>
            <Input id="pcontact" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="packa">
              {t('pond.accessKa')} · {t('common.optional')}
            </Label>
            <Textarea id="packa" maxLength={500} value={accessKa} onChange={(e) => setAccessKa(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pacen">
              {t('pond.accessEn')} · {t('common.optional')}
            </Label>
            <Textarea id="pacen" maxLength={500} value={accessEn} onChange={(e) => setAccessEn(e.target.value)} />
          </div>

          {error && <Notice $warn>{error}</Notice>}

          <Btn type="button" $accent $block disabled={busy || !valid} onClick={() => void submit()}>
            {busy ? t('pond.submitting') : t('pond.submit')}
          </Btn>
        </>
      )}
    </ModalSheet>
  )
}
