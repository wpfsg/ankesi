import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Spot, SpeciesId } from '../types'
import type { Lang } from '../i18n'
import { SPECIES } from '../data/species'
import { insertCatch, type SnapshotInput } from '../lib/db'
import { ModalSheet } from './ModalSheet'
import { Btn, FileBtn, Grid2, Input, Label, Muted, Notice, Select, Textarea } from '../styles/shared'
import { Preview, Switch } from './CatchForm.styles'

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
      <Muted as="p" style={{ margin: 0 }}>
        {lang === 'ka' ? spot.nameKa : spot.nameEn} · {t('catch.conditionsAttached')}
      </Muted>

      <div>
        <Label htmlFor="species">{t('catch.species')}</Label>
        <Select id="species" value={speciesId} onChange={(e) => setSpeciesId(e.target.value as SpeciesId)}>
          {speciesOrder.map((id) => (
            <option key={id} value={id}>
              {lang === 'ka' ? SPECIES[id].nameKa : SPECIES[id].nameEn}
            </option>
          ))}
        </Select>
      </div>

      <Grid2>
        <div>
          <Label htmlFor="weight">{t('catch.weight')}</Label>
          <Input id="weight" type="number" inputMode="decimal" step="0.05" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="length">{t('catch.length')}</Label>
          <Input id="length" type="number" inputMode="decimal" step="0.5" min="0" value={length} onChange={(e) => setLength(e.target.value)} />
        </div>
      </Grid2>

      <Grid2>
        <div>
          <Label htmlFor="bait">{t('catch.bait')}</Label>
          <Input id="bait" maxLength={80} value={bait} onChange={(e) => setBait(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="method">{t('catch.method')}</Label>
          <Input id="method" maxLength={80} value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
      </Grid2>

      <div>
        <Label htmlFor="note">
          {t('catch.note')} · {t('common.optional')}
        </Label>
        <Textarea id="note" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div>
        <FileBtn>
          <input type="file" accept="image/*" capture="environment" onChange={(e) => pick(e.target.files?.[0])} />
          {t('catch.photo')} · {t('common.optional')}
        </FileBtn>
        {preview && <Preview src={preview} alt="" style={{ marginTop: 8 }} />}
      </div>

      <Switch>
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        {t('catch.public')}
      </Switch>
      {photo && <Muted>{t('catch.photoPublicNote')}</Muted>}

      {error && <Notice $warn>{error}</Notice>}

      <Btn type="button" $accent $block disabled={busy} onClick={() => void save()}>
        {busy ? t('catch.saving') : t('catch.save')}
      </Btn>
    </ModalSheet>
  )
}
