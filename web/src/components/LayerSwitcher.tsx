import { useTranslation } from 'react-i18next'
import { MAP_LAYERS, setLayer, useMapLayer } from '../lib/mapLayer'
import { Rail, RailGroup, RailItem, RailLabel, RailSwatch } from './LayerSwitcher.styles'

/** Vertical glass rail on the right edge with the base maps laid out
 *  directly; tapping one swaps the map style. */
interface Props {
  /** Hide while the spot detail panel is open. */
  hidden?: boolean
}

export function LayerSwitcher({ hidden }: Props) {
  const { t } = useTranslation()
  const layer = useMapLayer()

  return (
    <Rail $hidden={hidden} aria-label={t('layers.title')}>
      <RailGroup role="radiogroup" aria-label={t('layers.title')}>
        {MAP_LAYERS.map((l) => (
          <RailItem
            key={l.id}
            type="button"
            role="radio"
            aria-checked={layer === l.id}
            data-layer={l.id}
            onClick={() => setLayer(l.id)}
            title={t(`layers.${l.id}`)}
          >
            <RailSwatch aria-hidden="true" />
            <RailLabel>{t(`layers.${l.id}`)}</RailLabel>
          </RailItem>
        ))}
      </RailGroup>
    </Rail>
  )
}
