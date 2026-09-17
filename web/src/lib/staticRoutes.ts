import { SPOTS } from '../data/spots'
import { PLANS } from '../content/pricing'

/** Every prerendered path, without the language prefix. The prerenderer
 *  renders each for both languages and lists them in the sitemap. */
export interface StaticRoute {
  path: string
  kind: 'map' | 'spots' | 'spot' | 'page' | 'checkout'
  spotId?: string
  /** Kept out of the sitemap and marked noindex. */
  noindex?: boolean
}

export function staticRoutes(): StaticRoute[] {
  return [
    { path: '', kind: 'map' },
    { path: '/spots', kind: 'spots' },
    ...SPOTS.map((s) => ({ path: `/spots/${s.id}`, kind: 'spot' as const, spotId: s.id })),
    { path: '/how-it-works', kind: 'page' },
    { path: '/faq', kind: 'page' },
    { path: '/pricing', kind: 'page' },
    { path: '/reports', kind: 'page' },
    // Private: prerendered as the signed-out shell, kept out of the sitemap.
    { path: '/account', kind: 'page', noindex: true },
    ...PLANS.map((p) => ({ path: `/checkout/${p.id}`, kind: 'checkout' as const, noindex: true })),
  ]
}
