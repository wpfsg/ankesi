import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { bandOf } from '../lib/scoring'
import { Legend, LegendScore, LegendTitle, Ramp, RampLabels, RampPointer, RampWrap } from './ScoreLegend.styles'

interface Props {
  /** Hide on every screen size (the trip planner is open). */
  hidden?: boolean
  /** Phones: hide while a spot sheet covers the map. */
  hideOnPhone?: boolean
  /** Current score of the selected spot; marks its place on the ramp. */
  score?: number
}

/** Explains the 0–100 score colours once, so pins need no legend of their own. */
export function ScoreLegend({ hidden, hideOnPhone, score }: Props) {
  const { t } = useTranslation()
  const hasScore = typeof score === 'number' && !Number.isNaN(score)
  const pct = hasScore ? Math.max(0, Math.min(100, score)) : 0
  return (
    <Legend $hidden={hidden} $hideOnPhone={hideOnPhone} role="img" aria-label={t('legend.title')}>
      <LegendTitle>
        {t('legend.title')}
        {hasScore && <LegendScore data-band={bandOf(score)}>{Math.round(score)}</LegendScore>}
      </LegendTitle>
      <RampWrap>
        {hasScore && <RampPointer style={{ '--pct': `${pct}%` } as CSSProperties} />}
        <Ramp />
      </RampWrap>
      <RampLabels>
        <span>0 · {t('legend.weak')}</span>
        <span>50 · {t('legend.fair')}</span>
        <span>100 · {t('legend.great')}</span>
      </RampLabels>
    </Legend>
  )
}
