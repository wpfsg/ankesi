import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Spot, SpeciesId } from '../types'
import type { Lang } from '../i18n'
import { SPECIES } from '../data/species'
import { insertCatch, type SnapshotInput } from '../lib/db'
import { ModalSheet } from './ModalSheet'

interface Props {
  spot: Spot
  snap: SnapshotInput
  userId: string
  lang: Lang
  onClose: () => void
  onSaved: () => void
}

export function CatchForm({ spot, snap, userId, lang, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const speciesOrder = useMemo(() => {
    const local = Object.keys(spot.species) as SpeciesId[]
    const rest = (Object.keys(SPECIES) as SpeciesId[]).filter((id) => !local.includes(id) && !SPECIES[id].protectedSpecies)
    return [...local, ...rest]
  }, [spot])

  const [speciesId, setSpeciesId] = useState<SpeciesId>(speciesOrder[0])
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [bait, setBait] = useState('')
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [photo, setPhoto] = useState<File | undefined>()
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = (f: File | undefined) => {
    setPhoto(f)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await insertCatch({
        spotId: spot.id,
        speciesId,
        weightKg: weight ? parseFloat(weight) : undefined,
        lengthCm: length ? parseFloat(length) : undefined,
        bait,
        method,
        note,
        isPublic,
        photo,
        userId,
        snap,
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
      setBusy(false)
    }
  }

  return (
    <ModalSheet title={t('catch.title')} onClose={onClose}>
      <p className="muted" style={{ margin: 0 }}>
        {lang === 'ka' ? spot.nameKa : spot.nameEn} · {t('catch.conditionsAttached')}
      </p>

      <div>
        <label className="label" htmlFor="species">
          {t('catch.species')}
        </label>
        <select id="species" className="select" value={speciesId} onChange={(e) => setSpeciesId(e.target.value as SpeciesId)}>
          {speciesOrder.map((id) => (
            <option key={id} value={id}>
              {lang === 'ka' ? SPECIES[id].nameKa : SPECIES[id].nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="grid2">
        <div>
          <label className="label" htmlFor="weight">
            {t('catch.weight')}
          </label>
          <input id="weight" className="input" type="number" inputMode="decimal" step="0.05" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="length">
            {t('catch.length')}
          </label>
          <input id="length" className="input" type="number" inputMode="decimal" step="0.5" min="0" value={length} onChange={(e) => setLength(e.target.value)} />
        </div>
      </div>

      <div className="grid2">
        <div>
          <label className="label" htmlFor="bait">
            {t('catch.bait')}
          </label>
          <input id="bait" className="input" maxLength={80} value={bait} onChange={(e) => setBait(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="method">
            {t('catch.method')}
          </label>
          <input id="method" className="input" maxLength={80} value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          {t('catch.note')} · {t('common.optional')}
        </label>
        <textarea id="note" className="textarea" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div>
        <label className="filebtn">
          <input type="file" accept="image/*" capture="environment" onChange={(e) => pick(e.target.files?.[0])} />
          {t('catch.photo')} · {t('common.optional')}
        </label>
        {preview && <img className="preview" src={preview} alt="" style={{ marginTop: 8 }} />}
      </div>

      <label className="switch">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        {t('catch.public')}
      </label>
      {photo && <div className="muted">{t('catch.photoPublicNote')}</div>}

      {error && <div className="notice warn">{error}</div>}

      <button type="button" className="btn accent block" disabled={busy} onClick={() => void save()}>
        {busy ? t('catch.saving') : t('catch.save')}
      </button>
    </ModalSheet>
  )
}
