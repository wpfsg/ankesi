import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import styled from 'styled-components'
import type { Region, SpeciesId, SpotType } from '../types'
import { SPOTS } from '../data/spots'
import { SPECIES } from '../data/species'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { breadcrumbList, itemList } from '../lib/seo'
import { emptyView, useSnapshot, viewFromResult, viewFromSnapshot, type SpotView } from '../lib/snapshot'
import { useLiveScores } from '../lib/useLiveScores'
import { isHydrating } from '../lib/hydration'
import { fmtTime } from '../lib/format'
import { speciesName, spotName } from '../lib/spotInfo'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { SpotCard } from '../components/SpotCard'
import { GlassSelect } from '../components/GlassSelect'
import { ButtonLink, CardGrid, Eyebrow, GlassInput, H1, Lead, Muted, Page, PageHead } from '../styles/page'

const REGIONS: Region[] = [
  'tbilisi',
  'kakheti',
  'kvemo-kartli',
  'mtskheta-mtianeti',
  'shida-kartli',
  'samtskhe-javakheti',
  'imereti',
  'racha',
  'samegrelo',
  'guria',
  'adjara',
]
const TYPES: SpotType[] = ['lake', 'reservoir', 'river', 'sea']
const SPECIES_IDS = (Object.keys(SPECIES) as SpeciesId[]).filter((id) => !SPECIES[id].protectedSpecies)

type Sort = 'score' | 'name'

interface Filters {
  q: string
  region: string
  type: string
  species: string
  sort: Sort
}

const EMPTY: Filters = { q: '', region: '', type: '', species: '', sort: 'score' }

function fromParams(p: URLSearchParams): Filters {
  const sort = p.get('sort')
  return {
    q: p.get('q') ?? '',
    region: p.get('region') ?? '',
    type: p.get('type') ?? '',
    species: p.get('species') ?? '',
    sort: sort === 'name' ? 'name' : 'score',
  }
}

/* Search on top, then the same chip dropdowns the trip planner uses. */
const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;

  @media (min-width: 720px) {
    input {
      max-width: 420px;
    }
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Count = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 16px;
  align-items: baseline;
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--fg-3);

  button {
    color: var(--accent);
    font-weight: 600;
  }
`

/** Browsable catalog of every spot with today's score and filters. */
export function SpotsPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const [params, setParams] = useSearchParams()
  const snapshot = useSnapshot()
  const live = useLiveScores()

  // Prerendered markup is unfiltered; apply the URL after hydration.
  const [filters, setFilters] = useState<Filters>(() => (isHydrating() ? EMPTY : fromParams(params)))
  const paramKey = params.toString()
  useEffect(() => {
    setFilters(fromParams(new URLSearchParams(paramKey)))
  }, [paramKey])

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    const p = new URLSearchParams()
    if (next.q) p.set('q', next.q)
    if (next.region) p.set('region', next.region)
    if (next.type) p.set('type', next.type)
    if (next.species) p.set('species', next.species)
    if (next.sort !== 'score') p.set('sort', next.sort)
    setParams(p, { replace: true })
  }

  const views = useMemo(() => {
    const out: Record<string, SpotView> = {}
    for (const s of SPOTS) {
      const r = live.results?.[s.id]
      if (r) out[s.id] = viewFromResult(r)
      else if (snapshot?.spots[s.id]) out[s.id] = viewFromSnapshot(snapshot.spots[s.id], snapshot.generatedAt)
      else out[s.id] = emptyView()
    }
    return out
  }, [live.results, snapshot])

  const list = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    const rows = SPOTS.filter((s) => {
      if (filters.region && s.region !== filters.region) return false
      if (filters.type && s.type !== filters.type) return false
      if (filters.species && !(filters.species in s.species)) return false
      if (q) {
        const hay = `${s.nameKa} ${s.nameEn} ${t(`region.${s.region}`)} ${t(`type.${s.type}`)}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (filters.sort === 'name') rows.sort((a, b) => spotName(a, lang).localeCompare(spotName(b, lang), lang))
    else rows.sort((a, b) => (views[b.id].score ?? -1) - (views[a.id].score ?? -1))
    return rows
  }, [filters, views, lang, t])

  const active = filters.region || filters.type || filters.species || filters.q
  const updatedAt = live.updatedAt ?? (snapshot ? new Date(snapshot.generatedAt) : null)
  const regionName = filters.region ? t(`region.${filters.region}`) : ''
  const speciesLabel = filters.species ? speciesName(filters.species as SpeciesId, lang) : ''

  const title = regionName
    ? t('seo.spots.titleRegion', { region: regionName })
    : speciesLabel
      ? t('seo.spots.titleSpecies', { species: speciesLabel })
      : t('seo.spots.title')

  return (
    <Page>
      <Head
        title={title}
        description={t('seo.spots.description', { count: SPOTS.length })}
        path={paths.spots(lang)}
        lang={lang}
        jsonLd={[
          breadcrumbList([{ name: t('nav.map'), to: paths.map(lang) }, { name: t('nav.spots') }]),
          itemList(
            t('seo.spots.title'),
            SPOTS.map((s) => paths.spot(lang, s.id)),
          ),
        ]}
      />
      <Breadcrumbs items={[{ name: t('nav.map'), to: paths.map(lang) }, { name: t('nav.spots') }]} />
      <PageHead>
        <Eyebrow>{t('spots.eyebrow')}</Eyebrow>
        <H1>{regionName ? t('spots.titleRegion', { region: regionName }) : speciesLabel ? t('spots.titleSpecies', { species: speciesLabel }) : t('spots.title')}</H1>
        <Lead>{t('spots.lead', { count: SPOTS.length })}</Lead>
      </PageHead>

      <Toolbar role="search" aria-label={t('spots.filters.title')}>
        <GlassInput
          type="search"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder={t('spots.filters.search')}
          aria-label={t('spots.filters.search')}
        />
        <Chips>
          <GlassSelect
            value={filters.region as Region | ''}
            options={REGIONS.map((r) => ({ value: r, label: t(`region.${r}`) }))}
            placeholder={t('spots.filters.region')}
            allLabel={t('spots.filters.allRegions')}
            ariaLabel={t('spots.filters.region')}
            onChange={(region) => update({ region })}
          />
          <GlassSelect
            value={filters.type as SpotType | ''}
            options={TYPES.map((ty) => ({ value: ty, label: t(`type.${ty}`) }))}
            placeholder={t('spots.filters.type')}
            allLabel={t('spots.filters.allTypes')}
            ariaLabel={t('spots.filters.type')}
            onChange={(type) => update({ type })}
          />
          <GlassSelect
            value={filters.species as SpeciesId | ''}
            options={SPECIES_IDS.map((id) => ({ value: id, label: speciesName(id, lang) }))}
            placeholder={t('spots.filters.species')}
            allLabel={t('spots.filters.allSpecies')}
            ariaLabel={t('spots.filters.species')}
            onChange={(species) => update({ species })}
          />
          {/* Sorting by score is the default, so it takes the "all" slot. */}
          <GlassSelect
            value={filters.sort === 'name' ? 'name' : ''}
            options={[{ value: 'name' as const, label: t('spots.filters.sortName') }]}
            placeholder={t('spots.filters.sortScore')}
            allLabel={t('spots.filters.sortScore')}
            ariaLabel={t('spots.filters.sort')}
            onChange={(v) => update({ sort: v === 'name' ? 'name' : 'score' })}
          />
        </Chips>
      </Toolbar>

      <Count>
        <span>
          {t('spots.count', { count: list.length })}
          {updatedAt && ` · ${t(live.results ? 'spots.updatedLive' : 'spots.updatedSnapshot', { time: fmtTime(updatedAt, lang) })}`}
        </span>
        {active && (
          <button type="button" onClick={() => update(EMPTY)}>
            {t('spots.filters.clear')}
          </button>
        )}
      </Count>

      {list.length === 0 ? (
        <Muted>{t('spots.empty')}</Muted>
      ) : (
        <CardGrid $min={300}>
          {list.map((s) => (
            <SpotCard key={s.id} spot={s} view={views[s.id]} lang={lang} />
          ))}
        </CardGrid>
      )}

      <div style={{ marginTop: 32 }}>
        <ButtonLink to={paths.map(lang)}>{t('spots.openMap')}</ButtonLink>
      </div>
    </Page>
  )
}
