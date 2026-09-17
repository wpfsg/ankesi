import type { Region, SpeciesId } from '../types'
import { isLang, type Lang } from '../i18n'

/** Every app path is built here so a URL change is a one-line edit. Paths
 *  are relative to the deployment base; the router adds the base. */
export const paths = {
  map: (l: Lang) => `/${l}`,
  mapSpot: (l: Lang, id: string) => `/${l}?spot=${encodeURIComponent(id)}`,
  account: (l: Lang) => `/${l}?account=1`,
  spots: (l: Lang) => `/${l}/spots`,
  spot: (l: Lang, id: string) => `/${l}/spots/${id}`,
  /** Region hubs arrive in phase 2; until then the filtered catalog. */
  region: (l: Lang, r: Region) => `/${l}/spots?region=${r}`,
  species: (l: Lang, s: SpeciesId) => `/${l}/spots?species=${s}`,
  how: (l: Lang) => `/${l}/how-it-works`,
  faq: (l: Lang) => `/${l}/faq`,
  pricing: (l: Lang) => `/${l}/pricing`,
  checkout: (l: Lang, plan: string) => `/${l}/checkout/${plan}`,
  reports: (l: Lang) => `/${l}/reports`,
}

/** Header items, in order. FAQ and the rest live in the footer. */
export const NAV_ITEMS = [
  { key: 'map', to: paths.map },
  { key: 'spots', to: paths.spots },
  { key: 'how', to: paths.how },
  { key: 'pricing', to: paths.pricing },
] as const

export type NavKey = (typeof NAV_ITEMS)[number]['key']

/** Same page in the other language: "/ka/spots/lisi" → "/en/spots/lisi". */
export function switchLang(pathname: string, lang: Lang): string {
  const parts = pathname.split('/')
  if (isLang(parts[1])) parts[1] = lang
  else parts.splice(1, 0, lang)
  return parts.join('/').replace(/\/$/, '') || `/${lang}`
}

/** "/ka/spots/lisi" → "/spots/lisi"; "/ka" → "". */
export function stripLang(pathname: string): string {
  return pathname.replace(/^\/(ka|en)(?=\/|$)/, '').replace(/\/$/, '')
}

/** Language from a pathname, or null when there is no prefix. */
export function langOf(pathname: string): Lang | null {
  const first = pathname.split('/')[1]
  return isLang(first) ? first : null
}
