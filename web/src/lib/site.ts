/** Absolute site address used for canonical URLs, hreflang, sitemap and
 *  Open Graph tags. Origin comes from the build environment so the same
 *  code serves the GitHub project page and a custom domain. */
export const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN as string | undefined)?.replace(/\/$/, '') ?? 'https://wpfsg.github.io'

/** Deployment base path without trailing slash: "" locally, "/ankesi" on
 *  the GitHub project page. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Absolute URL for an app path such as "/ka/spots/lisi". */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${BASE}${path}`
}

/** Public URL of a build-time asset such as an Open Graph image. */
export function assetUrl(path: string): string {
  return `${SITE_ORIGIN}${BASE}/${path.replace(/^\//, '')}`
}
