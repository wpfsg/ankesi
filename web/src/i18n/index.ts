import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ka from './ka'
import en from './en'

export type Lang = 'ka' | 'en'
export const LANGS: Lang[] = ['ka', 'en']

const STORAGE_KEY = 'ankesi.lang'

/** Deployment base path without trailing slash: "" locally, "/ankesi" on
 *  the GitHub project page. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

function isLang(v: unknown): v is Lang {
  return v === 'ka' || v === 'en'
}

/** Path without the deployment base, e.g. "/en/foo". */
function appPath(pathname: string): string {
  return BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname
}

/** Absolute path for a language root, e.g. "/ankesi/en". */
export function langPath(lang: Lang): string {
  return `${BASE}/${lang}`
}

/** URL path prefix wins, then saved choice, then browser language, then Georgian. */
export function detectLang(): Lang {
  const first = appPath(window.location.pathname).split('/')[1]
  if (isLang(first)) return first
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // storage unavailable
  }
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('en')) return 'en'
  return 'ka'
}

/** Reflect the language in <html lang>, storage, and the URL prefix. */
export function applyLang(lang: Lang) {
  document.documentElement.lang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // storage unavailable
  }
  const { pathname, search, hash } = window.location
  const rest = appPath(pathname).replace(/^\/(ka|en)(?=\/|$)/, '').replace(/^\/$/, '')
  const next = `${langPath(lang)}${rest}${search}${hash}`
  if (next !== `${pathname}${search}${hash}`) {
    window.history.replaceState(null, '', next)
  }
}

export function setLang(lang: Lang) {
  void i18n.changeLanguage(lang)
  applyLang(lang)
}

void i18n.use(initReactI18next).init({
  resources: {
    ka: { translation: ka },
    en: { translation: en },
  },
  lng: detectLang(),
  fallbackLng: 'ka',
  interpolation: { escapeValue: false },
  returnNull: false,
})

applyLang(isLang(i18n.language) ? i18n.language : 'ka')

export default i18n
