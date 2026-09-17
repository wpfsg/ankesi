/** Plans and the free / premium split. Prices are placeholders in GEL until
 *  billing is decided; labels live in i18n under pricing.*. */

export type PlanId = 'monthly' | 'annual' | 'week'

export interface Plan {
  id: PlanId
  priceGel: number
  period: 'month' | 'year' | 'week'
  /** Equivalent monthly price shown under annual. */
  perMonthGel?: number
  recommended?: boolean
  /** i18n key under pricing.badges */
  badge?: string
}

export const PLANS: Plan[] = [
  { id: 'monthly', priceGel: 4.99, period: 'month' },
  { id: 'annual', priceGel: 49.9, period: 'year', perMonthGel: 4.16, recommended: true, badge: 'twoMonthsFree' },
  { id: 'week', priceGel: 3.99, period: 'week', badge: 'forVisitors' },
]

export function planById(id: string | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

/** A cell is included, excluded, or a short i18n value key under pricing.values. */
export type Cell = boolean | string

export interface Feature {
  id: string
  free: Cell
  premium: Cell
}

/** Order matters: the acquisition features first, then the depth. */
export const FEATURES: Feature[] = [
  { id: 'map', free: true, premium: true },
  { id: 'todayScore', free: true, premium: true },
  { id: 'factors', free: true, premium: true },
  { id: 'window48', free: true, premium: true },
  { id: 'reports', free: true, premium: true },
  { id: 'savedSpots', free: 'one', premium: 'unlimited' },
  { id: 'forecast7', free: false, premium: true },
  { id: 'alerts', free: false, premium: true },
  { id: 'factorHistory', free: false, premium: true },
  { id: 'compare', free: false, premium: true },
  { id: 'planner7', free: false, premium: true },
  { id: 'offline', free: false, premium: true },
  { id: 'earlyAccess', free: false, premium: true },
]

export const FREE_HIGHLIGHTS = ['map', 'todayScore', 'factors', 'window48', 'reports']
export const PREMIUM_HIGHLIGHTS = ['forecast7', 'alerts', 'factorHistory', 'compare', 'offline']
