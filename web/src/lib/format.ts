export const TZ = 'Asia/Tbilisi'
/** Georgia is UTC+4 all year, no daylight saving. */
export const TBILISI_OFFSET_MS = 4 * 3600 * 1000

export function intlLocale(lang: string): string {
  return lang === 'ka' ? 'ka-GE' : 'en-GB'
}

export function fmtTime(d: Date, lang: string): string {
  return new Intl.DateTimeFormat(intlLocale(lang), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(d)
}

export function fmtHour(d: Date): string {
  return String(tbilisiParts(d).hour).padStart(2, '0')
}

export function fmtDayShort(d: Date, lang: string): string {
  return new Intl.DateTimeFormat(intlLocale(lang), {
    weekday: 'short',
    timeZone: TZ,
  }).format(d)
}

export function fmtSigned(n: number, digits = 1): string {
  const s = n.toFixed(digits)
  return n > 0 ? `+${s}` : s
}

/** "3 hours ago" in the user's language. */
export function timeAgo(d: Date, lang: string, now = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat(intlLocale(lang), { numeric: 'auto' })
  const diffMin = Math.round((d.getTime() - now.getTime()) / 60000)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffH = Math.round(diffMin / 60)
  if (Math.abs(diffH) < 24) return rtf.format(diffH, 'hour')
  return rtf.format(Math.round(diffH / 24), 'day')
}

export function fmtDate(d: Date, lang: string): string {
  return new Intl.DateTimeFormat(intlLocale(lang), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(d)
}

/** Calendar parts in Tbilisi local time without Intl overhead. */
export function tbilisiParts(d: Date): { dateKey: string; hour: number } {
  const local = new Date(d.getTime() + TBILISI_OFFSET_MS)
  const y = local.getUTCFullYear()
  const m = String(local.getUTCMonth() + 1).padStart(2, '0')
  const day = String(local.getUTCDate()).padStart(2, '0')
  return { dateKey: `${y}-${m}-${day}`, hour: local.getUTCHours() }
}

/** Date key for today + n days in Tbilisi time. */
export function tbilisiDateKey(offsetDays: number, now = new Date()): string {
  return tbilisiParts(new Date(now.getTime() + offsetDays * 86400000)).dateKey
}

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Rough drive time: straight line × 1.3 road factor at 55 km/h. Estimate only. */
export function estimateDriveMinutes(km: number): number {
  return Math.round(((km * 1.3) / 55) * 60)
}

/** Price in lari: "4,99 ₾" in Georgian, "4.99 ₾" in English. Formatted by
 *  hand so prerendered and browser output match regardless of ICU data. */
export function fmtGel(n: number, lang: string): string {
  const s = n.toFixed(2)
  return `${lang === 'ka' ? s.replace('.', ',') : s} ₾`
}

/** Whole kilometres, e.g. "12 km" (unit label comes from i18n). */
export function fmtKm(km: number): string {
  return String(Math.round(km))
}
