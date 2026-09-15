import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Catch, Spot } from '../types'
import type { Lang } from '../i18n'
import { SPECIES } from '../data/species'
import { deleteCatch, fetchMyCatches } from '../lib/db'
import { photoUrl } from '../lib/supabase'
import { fmtDate } from '../lib/format'
import { ModalSheet } from './ModalSheet'

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
      {error && <div className="notice warn">{error}</div>}
      {items === null && !error && <div className="muted">{t('common.loading')}</div>}
      {items && items.length === 0 && <div className="muted">{t('catch.empty')}</div>}
      {items && items.length > 0 && <div className="muted">{t('catch.total', { count: items.length })}</div>}
      {items?.map((c) => {
        const sp = SPECIES[c.speciesId]
        const spot = spotsById[c.spotId]
        const url = photoUrl(c.photoPath)
        return (
          <div key={c.id} className="catch-item">
            {url ? <img className="thumb" src={url} alt="" loading="lazy" /> : <div className="thumb" />}
            <div className="catch-body">
              {sp ? (lang === 'ka' ? sp.nameKa : sp.nameEn) : c.speciesId}
              {c.weightKg !== null ? ` · ${c.weightKg} kg` : ''}
              {c.lengthCm !== null ? ` · ${c.lengthCm} cm` : ''}
              <small>
                {spot ? (lang === 'ka' ? spot.nameKa : spot.nameEn) : c.spotId} · {fmtDate(c.caughtAt, lang)}
                {c.bait ? ` · ${c.bait}` : ''}
              </small>
            </div>
            <button type="button" className="badge" onClick={() => void remove(c.id)}>
              {t('common.delete')}
            </button>
          </div>
        )
      })}
    </ModalSheet>
  )
}
