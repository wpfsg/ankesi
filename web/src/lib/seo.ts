import type { Spot } from '../types'
import type { Lang } from '../i18n'
import { absoluteUrl, assetUrl } from './site'
import { paths } from './routes'

/* JSON-LD builders. Each returns a plain object for <Head jsonLd>. */

export interface Crumb {
  name: string
  /** App path with language prefix; omitted for the current page. */
  to?: string
}

export function breadcrumbList(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.to ? { item: absoluteUrl(c.to) } : {}),
    })),
  }
}

const WATER_TYPE: Record<Spot['type'], string> = {
  lake: 'LakeBodyOfWater',
  reservoir: 'Reservoir',
  river: 'RiverBodyOfWater',
  sea: 'SeaBodyOfWater',
  paid: 'Pond',
}

export function spotPlace(spot: Spot, lang: Lang, opts: { description: string; regionName: string; image: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', WATER_TYPE[spot.type]],
    name: lang === 'ka' ? spot.nameKa : spot.nameEn,
    alternateName: lang === 'ka' ? spot.nameEn : spot.nameKa,
    description: opts.description,
    url: absoluteUrl(paths.spot(lang, spot.id)),
    image: assetUrl(opts.image),
    touristType: lang === 'ka' ? 'მეთევზეები' : 'Anglers',
    geo: { '@type': 'GeoCoordinates', latitude: spot.lat, longitude: spot.lon },
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: opts.regionName,
      containedInPlace: { '@type': 'Country', name: lang === 'ka' ? 'საქართველო' : 'Georgia' },
    },
    isAccessibleForFree: spot.type !== 'paid',
  }
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }
}

export function organization(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: lang === 'ka' ? 'ანკესი' : 'Ankesi',
    url: absoluteUrl(paths.map(lang)),
    logo: assetUrl('favicon.svg'),
  }
}

export function softwareApplication(lang: Lang, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: lang === 'ka' ? 'ანკესი' : 'Ankesi',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    description,
    url: absoluteUrl(paths.map(lang)),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GEL' },
    inLanguage: ['ka', 'en'],
  }
}

export function itemList(name: string, urls: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: urls.length,
    itemListElement: urls.map((u, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(u) })),
  }
}
