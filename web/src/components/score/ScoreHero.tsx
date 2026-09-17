import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Confidence } from '../../types'
import { bandOf } from '../../lib/scoring'
import { BandLabel, BandSummary, ConfChip, Hero, HeroMeta, RingValue, ScoreRing } from './score.styles'

interface Props {
  score?: number
  confidence: Confidence
  size?: 'panel' | 'page'
  onClick?: () => void
}

/** Score ring with band label, one-line summary and confidence chip. */
export function ScoreHero({ score, confidence, size = 'panel', onClick }: Props) {
  const { t } = useTranslation()
  const band = bandOf(score)
  return (
    <Hero $size={size} onClick={onClick}>
      <ScoreRing $size={size} data-band={band} style={{ '--pct': `${score ?? 0}%` } as CSSProperties} aria-hidden="true">
        <RingValue $size={size}>{score ?? '·'}</RingValue>
      </ScoreRing>
      <HeroMeta data-band={band}>
        {/* The panel has no other headings; a page already has its h1/h2 outline. */}
        <BandLabel $size={size} as={size === 'page' ? 'p' : 'h3'}>
          {t(`band.${band}`)}
        </BandLabel>
        <BandSummary>{t(`summary.${band}`)}</BandSummary>
        <ConfChip>
          {t('confidence.label')}: {t(`confidence.${confidence}`)}
        </ConfChip>
      </HeroMeta>
    </Hero>
  )
}
