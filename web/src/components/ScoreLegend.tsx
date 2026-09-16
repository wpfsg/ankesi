import { useTranslation } from 'react-i18next'
import { Legend, LegendTitle, Ramp, RampLabels } from './ScoreLegend.styles'

interface Props {
  /** Desktop: slide right of the open planner panel. */
  shift?: boolean
  /** Phones: hide while a spot sheet or the planner covers the map. */
  hideOnPhone?: boolean
}

/** Explains the 0–100 score colours once, so pins need no legend of their own. */
export function ScoreLegend({ shift, hideOnPhone }: Props) {
  const { t } = useTranslation()
  return (
    <Legend $shift={shift} $hideOnPhone={hideOnPhone} role="img" aria-label={t('legend.title')}>
      <LegendTitle>{t('legend.title')}</LegendTitle>
      <Ramp />
      <RampLabels>
        <span>0 · {t('legend.weak')}</span>
        <span>50 · {t('legend.fair')}</span>
        <span>100 · {t('legend.great')}</span>
      </RampLabels>
    </Legend>
  )
}
