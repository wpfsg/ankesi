import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Spot } from '../types'
import { insertReport, type SnapshotInput } from '../lib/db'
import { ModalSheet } from './ModalSheet'
import { Btn, FileBtn, Label, Notice, Textarea } from '../styles/shared'
import { ActivitySeg } from './ReportForm.styles'

interface Props {
  spot: Spot
  snap: SnapshotInput
  userId: string
  onClose: () => void
  onSent: () => void
}

const LEVELS: Array<{ value: number; band: string }> = [
  { value: -2, band: 'dead' },
  { value: -1, band: 'slow' },
  { value: 0, band: 'ok' },
  { value: 1, band: 'good' },
  { value: 2, band: 'great' },
]

export function ReportForm({ spot, snap, userId, onClose, onSent }: Props) {
  const { t } = useTranslation()
  const [activity, setActivity] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    if (activity === null) return
    setBusy(true)
    setError(null)
    try {
      const r = await insertReport({ spotId: spot.id, activity, note, photo, userId, snap })
      if (r === 'too-soon') {
        setError(t('report.tooSoon'))
        setBusy(false)
        return
      }
      onSent()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
      setBusy(false)
    }
  }

  return (
    <ModalSheet title={t('report.title')} onClose={onClose}>
      <ActivitySeg role="radiogroup" aria-label={t('report.title')}>
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            role="radio"
            aria-checked={activity === l.value}
            aria-pressed={activity === l.value}
            data-band={l.band}
            onClick={() => setActivity(l.value)}
          >
            {t(`band.${l.band}`)}
          </button>
        ))}
      </ActivitySeg>

      <div>
        <Label htmlFor="rnote">
          {t('report.note')} · {t('common.optional')}
        </Label>
        <Textarea id="rnote" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <FileBtn>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0])} />
        {t('catch.photo')} · {t('common.optional')}
        {photo ? ` · ${photo.name}` : ''}
      </FileBtn>

      {error && <Notice $warn>{error}</Notice>}

      <Btn type="button" $accent $block disabled={busy || activity === null} onClick={() => void send()}>
        {busy ? t('report.sending') : t('report.send')}
      </Btn>
    </ModalSheet>
  )
}
