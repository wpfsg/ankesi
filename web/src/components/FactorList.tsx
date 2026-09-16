import { useTranslation } from 'react-i18next'
import type { FactorResult } from '../types'
import { rawLabel } from '../lib/factorLabel'
import { Badge, Tabular } from '../styles/shared'
import { Factor, FactorTop, FactorName, FactorVal, FactorBar, FactorFoot } from './FactorList.styles'

interface Props {
  factors: FactorResult[]
}

export function FactorList({ factors }: Props) {
  const { t } = useTranslation()
  return (
    <div>
      {factors.map((f) => {
        const raw = rawLabel(f)
        const state = f.state ? t(`state.${f.state}`) : ''
        const contribution = Math.round(f.weight * f.value)
        return (
          <Factor key={f.key}>
            <FactorTop>
              <FactorName>
                {t(`factor.${f.key}`)}{' '}
                {f.estimated && <Badge>{t('score.estimate')}</Badge>}
              </FactorName>
              <FactorVal>
                {raw}
                {raw && state ? ' · ' : ''}
                {state}
              </FactorVal>
            </FactorTop>
            <FactorBar>
              <span style={{ width: `${Math.round(f.value * 100)}%` }} />
            </FactorBar>
            <FactorFoot>
              <span>{t('score.weight', { weight: f.weight })}</span>
              <Tabular>
                +{contribution} / {f.weight}
              </Tabular>
            </FactorFoot>
          </Factor>
        )
      })}
    </div>
  )
}
