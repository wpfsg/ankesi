/** FAQ structure. Question and answer text live in i18n under
 *  faq.items.<id>.q / .a so both languages stay in sync by type. */

export const FAQ_GROUPS = ['product', 'forecast', 'fishing', 'account', 'billing'] as const
export type FaqGroup = (typeof FAQ_GROUPS)[number]

export interface FaqItem {
  id: string
  group: FaqGroup
}

export const FAQ_ITEMS: FaqItem[] = [
  { id: 'what-is-score', group: 'product' },
  { id: 'how-to-read-map', group: 'product' },
  { id: 'best-window', group: 'product' },
  { id: 'add-spot', group: 'product' },
  { id: 'reports-how', group: 'product' },
  { id: 'why-changed', group: 'forecast' },
  { id: 'sources', group: 'forecast' },
  { id: 'update-frequency', group: 'forecast' },
  { id: 'how-accurate', group: 'forecast' },
  { id: 'confidence', group: 'forecast' },
  { id: 'water-temp', group: 'forecast' },
  { id: 'is-it-allowed', group: 'fishing' },
  { id: 'closed-seasons', group: 'fishing' },
  { id: 'protected-species', group: 'fishing' },
  { id: 'paid-ponds', group: 'fishing' },
  { id: 'account-needed', group: 'account' },
  { id: 'saved-spots', group: 'account' },
  { id: 'privacy', group: 'account' },
  { id: 'what-is-premium', group: 'billing' },
  { id: 'billing-how', group: 'billing' },
  { id: 'cancel-refund', group: 'billing' },
  { id: 'expires', group: 'billing' },
]

/** Items shown on the pricing page under the plans. */
export const PRICING_FAQ_IDS = ['what-is-premium', 'billing-how', 'cancel-refund', 'expires']
