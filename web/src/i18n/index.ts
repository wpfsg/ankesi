import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ka from './ka'
import en from './en'

export type Lang = 'ka' | 'en'
export const LANGS: Lang[] = ['ka', 'en']

const STORAGE_KEY = 'ankesi.lang'

function isLang(v: unknown): v is Lang {
  return v === 'ka' || v === 'en'
}

/** URL path prefix wins, then saved choice, then browser language, then Georgian. */
export function detectLang(): Lang {
  const first = window.location.pathname.split('/')[1]
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
  const rest = pathname.replace(/^\/(ka|en)(?=\/|$)/, '')
  const next = `/${lang}${rest}${search}${hash}`
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
