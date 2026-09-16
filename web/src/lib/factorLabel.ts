import type { FactorResult } from '../types'
import { fmtSigned } from './format'

/** Human-readable raw measurement behind a factor ("+1.2 hPa", "14 km/h"). */
export function rawLabel(f: FactorResult): string {
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
