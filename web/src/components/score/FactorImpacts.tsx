import { useTranslation } from 'react-i18next'
import type { FactorResult } from '../../types'
import { rawLabel } from '../../lib/factorLabel'
import { ImpactIcon, ImpactList, ImpactRow, ImpactText } from './score.styles'

interface Props {
  factors: FactorResult[]
  /** How many of the strongest factors to show. */
  top?: number
}

/** How far a factor pulls the score from neutral, weighted. */
function impact(f: FactorResult): number {
  return Math.abs(f.value - 0.5) * f.weight
}

function toneOf(f: FactorResult): 'up' | 'down' | 'flat' {
  if (f.value >= 0.6) return 'up'
  if (f.value <= 0.4) return 'down'
  return 'flat'
}

const TONE_MARK = { up: '↑', down: '↓', flat: '•' } as const

/** The factors that move the score most, one line each: "Wind · light — 12 km/h — helps". */
export function FactorImpacts({ factors, top = 5 }: Props) {
  const { t } = useTranslation()
  const shown = [...factors].sort((a, b) => impact(b) - impact(a)).slice(0, top)
  return (
    <ImpactList>
      {shown.map((f) => {
        const tone = toneOf(f)
        const raw = rawLabel(f)
        const tail = tone === 'up' ? t('sheet.helps') : tone === 'down' ? t(`hint.${f.key}`) : ''
        return (
          <ImpactRow key={f.key}>
            <ImpactIcon $tone={tone} aria-hidden="true">
              {TONE_MARK[tone]}
            </ImpactIcon>
            <ImpactText>
              <b>
                {t(`factor.${f.key}`)}
                {f.state ? ` · ${t(`state.${f.state}`)}` : ''}
              </b>
              <span>
                {raw}
                {raw && tail ? ' — ' : ''}
                {tail}
              </span>
            </ImpactText>
          </ImpactRow>
        )
      })}
    </ImpactList>
  )
}
