import { useTranslation } from 'react-i18next'
import type { FactorResult } from '../types'
import { fmtSigned } from '../lib/format'

interface Props {
  factors: FactorResult[]
}

function rawLabel(f: FactorResult): string {
  switch (f.key) {
    case 'pressureTrend':
      return `${fmtSigned(f.raw, 1)} ${f.unit}`
    case 'pressureLevel':
      return `${Math.round(f.raw)} ${f.unit}`
    case 'waterTemp':
      return `${f.raw.toFixed(1)} ${f.unit}`
    case 'wind':
      return `${Math.round(f.raw)} ${f.unit}`
    case 'light':
      return `${Math.round(f.raw)} ${f.unit}`
    case 'water':
      return `${f.raw.toFixed(1)} ${f.unit} / 48h`
    case 'waves':
      return f.estimated ? '—' : `${f.raw.toFixed(1)} ${f.unit}`
    case 'moon':
      return `${f.raw} ${f.unit}`
    default:
      return ''
  }
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
          <div className="factor" key={f.key}>
            <div className="factor-top">
              <span className="factor-name">
                {t(`factor.${f.key}`)}{' '}
                {f.estimated && <span className="badge">{t('score.estimate')}</span>}
              </span>
              <span className="factor-val">
                {raw}
                {raw && state ? ' · ' : ''}
                {state}
              </span>
            </div>
            <div className="factor-bar">
              <span style={{ width: `${Math.round(f.value * 100)}%` }} />
            </div>
            <div className="factor-foot">
              <span>{t('score.weight', { weight: f.weight })}</span>
              <span className="tabular">
                +{contribution} / {f.weight}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
