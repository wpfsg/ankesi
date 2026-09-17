import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'ankesi.theme'
const EVENT = 'ankesi:theme'
const META_COLOR: Record<Theme, string> = { light: '#eef2f5', dark: '#0f1115' }

function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme
  return t === 'dark' || t === 'light' ? t : savedTheme() ?? systemTheme()
}

/** Flags <html> for the length of the crossfade so every surface eases to
 *  the new palette instead of cutting. Not used on the first paint, which
 *  has no previous colours to fade from. */
let shiftTimer: ReturnType<typeof setTimeout> | undefined

function crossfade() {
  const el = document.documentElement
  el.dataset.themeShift = ''
  clearTimeout(shiftTimer)
  shiftTimer = setTimeout(() => {
    delete el.dataset.themeShift
  }, 320)
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme])
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }))
}

export function setTheme(theme: Theme) {
  crossfade()
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // storage unavailable
  }
  applyTheme(theme)
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

/** Call once before first render. Follows the OS until the user chooses. */
export function initTheme() {
  applyTheme(savedTheme() ?? systemTheme())
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (savedTheme()) return
    crossfade()
    applyTheme(e.matches ? 'dark' : 'light')
  })
}

export function useTheme(): Theme {
  const [theme, set] = useState<Theme>(() => currentTheme())
  useEffect(() => {
    const on = (e: Event) => set((e as CustomEvent<Theme>).detail)
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  return theme
}
