import { useTranslation } from 'react-i18next'
import { fmtTime, tbilisiDateKey, tbilisiParts } from '../../lib/format'
import type { BestWindow } from '../../lib/snapshot'
import { BestCard } from './score.styles'

interface Props {
  best: BestWindow
  lang: string
  /** Reference "now"; defaults to the current time. */
  now?: Date
}

/** Best three-hour window in the next day, labelled today or upcoming. */
export function BestWindowCard({ best, lang, now }: Props) {
  const { t } = useTranslation()
  const today = tbilisiParts(best.start).dateKey === tbilisiDateKey(0, now)
  return (
    <BestCard>
      <small>{today ? t('sheet.bestToday') : t('sheet.bestUpcoming')}</small>
      <b>
        {fmtTime(best.start, lang)} – {fmtTime(best.end, lang)}
      </b>
      <i>{t('sheet.bestWindowNote', { avg: best.avg })}</i>
    </BestCard>
  )
}
