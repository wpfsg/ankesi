import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ka from './ka'
import en from './en'

export type Lang = 'ka' | 'en'
export const LANGS: Lang[] = ['ka', 'en']
export const DEFAULT_LANG: Lang = 'ka'

const STORAGE_KEY = 'ankesi.lang'
const isBrowser = typeof window !== 'undefined'

/** Deployment base path without trailing slash: "" locally, "/ankesi" on
 *  the GitHub project page. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export function isLang(v: unknown): v is Lang {
  return v === 'ka' || v === 'en'
}

/** Path without the deployment base, e.g. "/en/foo". */
export function appPath(pathname: string): string {
  return BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname
}

/** Absolute path for a language root, e.g. "/ankesi/en". */
export function langPath(lang: Lang): string {
  return `${BASE}/${lang}`
}

/** Language the browser should start in when the URL has no prefix: saved
 *  choice, then browser language, then Georgian. */
export function preferredLang(): Lang {
  if (!isBrowser) return DEFAULT_LANG
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // storage unavailable
  }
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('en')) return 'en'
  return DEFAULT_LANG
}

/** URL path prefix wins, then the preferred language. */
export function detectLang(): Lang {
  if (!isBrowser) return DEFAULT_LANG
  const first = appPath(window.location.pathname).split('/')[1]
  if (isLang(first)) return first
  return preferredLang()
}

/** Reflect the language in <html lang> and storage. The router owns the URL. */
export function applyLang(lang: Lang) {
  if (!isBrowser) return
  document.documentElement.lang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // storage unavailable
  }
}

export function setLang(lang: Lang) {
  if (i18n.language !== lang) void i18n.changeLanguage(lang)
  applyLang(lang)
}

void i18n.use(initReactI18next).init({
  resources: {
    ka: { translation: ka },
    en: { translation: en },
  },
  lng: detectLang(),
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false },
  returnNull: false,
})

applyLang(isLang(i18n.language) ? i18n.language : DEFAULT_LANG)

export default i18n
