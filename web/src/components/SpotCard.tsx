import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styled from 'styled-components'
import type { Spot } from '../types'
import type { Lang } from '../i18n'
import { paths } from '../lib/routes'
import type { SpotView } from '../lib/snapshot'
import { fmtTime } from '../lib/format'
import { speciesName, speciesSorted, spotName } from '../lib/spotInfo'
import { Badge, ScoreSquare, liquidGlass } from '../styles/shared'

const CardLink = styled(Link)`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px;
  ${liquidGlass}
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
  transition:
    transform var(--t) var(--spring),
    border-color var(--t) var(--ease),
    background var(--t) var(--ease),
    box-shadow var(--t) var(--ease);

  &:hover {
    border-color: var(--chip-on-brd);
    background: var(--glass-bg-strong);
    transform: translateY(-1px);
  }
`

const Body = styled.div`
  flex: 1;
  min-width: 0;
`

const Name = styled.h3`
  margin: 0;
  font-size: 15.5px;
  font-weight: 650;
  line-height: 1.25;
`

const Meta = styled.p`
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--fg-3);
`

const Best = styled.p`
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--best-fg);
  font-variant-numeric: tabular-nums;
`

const Species = styled.p`
  margin: 6px 0 0;
  font-size: 12.5px;
  color: var(--fg-2);
`

interface Props {
  spot: Spot
  view: SpotView
  lang: Lang
}

/** Catalog row: score tile, name, type · region, best window, species. */
export function SpotCard({ spot, view, lang }: Props) {
  const { t } = useTranslation()
  const species = speciesSorted(spot).slice(0, 3)
  return (
    <CardLink to={paths.spot(lang, spot.id)}>
      <ScoreSquare data-band={view.band} aria-label={t('legend.title')}>
        {view.score ?? '·'}
      </ScoreSquare>
      <Body>
        <Name>{spotName(spot, lang)}</Name>
        <Meta>
          {t(`type.${spot.type}`)} · {t(`region.${spot.region}`)}
          {spot.infoOnly && (
            <>
              {' '}
              <Badge $tone="warn">{t('spots.infoOnly')}</Badge>
            </>
          )}
        </Meta>
        {view.best && (
          <Best>{t('spots.best', { start: fmtTime(view.best.start, lang), end: fmtTime(view.best.end, lang), avg: view.best.avg })}</Best>
        )}
        {species.length > 0 && <Species>{species.map((id) => speciesName(id, lang)).join(' · ')}</Species>}
      </Body>
    </CardLink>
  )
}
