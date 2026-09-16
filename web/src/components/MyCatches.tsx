import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Catch, Spot } from '../types'
import type { Lang } from '../i18n'
import { SPECIES } from '../data/species'
import { deleteCatch, fetchMyCatches } from '../lib/db'
import { photoUrl } from '../lib/supabase'
import { fmtDate } from '../lib/format'
import { ModalSheet } from './ModalSheet'
import { Badge, CatchBody, CatchItem, Muted, Notice, Thumb } from '../styles/shared'

interface Props {
  userId: string
  spotsById: Record<string, Spot>
  lang: Lang
  onClose: () => void
}

export function MyCatches({ userId, spotsById, lang, onClose }: Props) {
  const { t } = useTranslation()
  const [items, setItems] = useState<Catch[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyCatches(userId)
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [userId])

  const remove = async (id: string) => {
    await deleteCatch(id)
    setItems((list) => (list ? list.filter((c) => c.id !== id) : list))
  }

  return (
    <ModalSheet title={t('catch.myTitle')} onClose={onClose}>
      {error && <Notice $warn>{error}</Notice>}
      {items === null && !error && <Muted>{t('common.loading')}</Muted>}
      {items && items.length === 0 && <Muted>{t('catch.empty')}</Muted>}
      {items && items.length > 0 && <Muted>{t('catch.total', { count: items.length })}</Muted>}
      {items?.map((c) => {
        const sp = SPECIES[c.speciesId]
        const spot = spotsById[c.spotId]
        const url = photoUrl(c.photoPath)
        return (
          <CatchItem key={c.id}>
            {url ? <Thumb src={url} alt="" loading="lazy" /> : <Thumb as="div" />}
            <CatchBody>
              {sp ? (lang === 'ka' ? sp.nameKa : sp.nameEn) : c.speciesId}
              {c.weightKg !== null ? ` · ${c.weightKg} kg` : ''}
              {c.lengthCm !== null ? ` · ${c.lengthCm} cm` : ''}
              <small>
                {spot ? (lang === 'ka' ? spot.nameKa : spot.nameEn) : c.spotId} · {fmtDate(c.caughtAt, lang)}
                {c.bait ? ` · ${c.bait}` : ''}
              </small>
            </CatchBody>
            <Badge as="button" type="button" onClick={() => void remove(c.id)}>
              {t('common.delete')}
            </Badge>
          </CatchItem>
        )
      })}
    </ModalSheet>
  )
}
