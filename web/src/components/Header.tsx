import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import type { Spot, SpotResult } from '../types'
import { LANGS, setLang, type Lang } from '../i18n'
import { bandOf } from '../lib/scoring'
import { displayNameOf } from '../lib/useSession'
import { toggleTheme, useTheme } from '../lib/theme'

interface Props {
  spots: Spot[]
  results: Record<string, SpotResult>
  user: User | null
  onSelect: (id: string) => void
  onAccount: () => void
}

/** Fixed glass header: brand, search, theme, language, account. Publishes
 *  its height as --header-h so the bottom sheet and pills sit below it. */
export function Header({ spots, results, user, onSelect, onAccount }: Props) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'en' ? 'en' : 'ka') as Lang
  const theme = useTheme()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    // Rank: name starts with the query, then any word starts with it, then substring.
    const rank = (s: Spot) => {
      const names = [s.nameKa.toLowerCase(), s.nameEn.toLowerCase()]
      if (names.some((n) => n.startsWith(q))) return 0
      if (names.some((n) => n.split(/[\s—\-/,]+/).some((w) => w.startsWith(q)))) return 1
      return 2
    }
    return spots
      .filter((s) => {
        const region = t(`region.${s.region}`).toLowerCase()
        const type = t(`type.${s.type}`).toLowerCase()
        return (
          s.nameKa.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          region.includes(q) ||
          type.includes(q)
        )
      })
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 8)
  }, [query, spots, t])

  const showResults = focused && query.trim().length > 0

  // Hide the floating pills while results are open so they don't show
  // through the glass.
  useEffect(() => {
    document.documentElement.classList.toggle('searching', showResults)
    return () => document.documentElement.classList.remove('searching')
  }, [showResults])

  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 480px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const on = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const placeholder = narrow ? t('search.placeholderShort') : t('search.placeholder')

  return (
    <header ref={ref} className="header glass">
      <div className="header-row">
        <div className="brand" aria-label={t('app.title')}>
          <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="var(--accent)" />
            <path d="M17 34c7-11 22-11 29 0-7 11-22 11-29 0z" fill="var(--accent-fg)" />
            <circle cx="39" cy="33" r="2.4" fill="var(--accent)" />
          </svg>
          <span className="brand-name">{t('app.title')}</span>
        </div>

        <div className="search">
          <svg className="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            placeholder={placeholder}
            aria-label={t('search.placeholder')}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <button
          type="button"
          className="icon-toggle"
          onClick={() => toggleTheme()}
          aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          title={t('theme.toggle')}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>

        <div className="langchip" role="group" aria-label="language">
          {LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>

        <button type="button" className="account-btn" onClick={onAccount} aria-label={t('account.open')}>
          {user ? (
            <span className="avatar">{(displayNameOf(user)[0] ?? '?').toUpperCase()}</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span className="account-label">{t('account.signIn')}</span>
            </>
          )}
        </button>
      </div>

      {showResults && (
        <div className="results glass header-results" role="listbox">
          {matches.length === 0 && <div className="result muted">{t('search.noResults')}</div>}
          {matches.map((s) => {
            const score = results[s.id]?.hours[0]?.score
            return (
              <button
                key={s.id}
                type="button"
                className="result"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(s.id)
                  setQuery('')
                  setFocused(false)
                }}
              >
                <span className="minibubble" data-band={bandOf(score)}>
                  {score ?? '·'}
                </span>
                <span className="result-name">
                  {lang === 'ka' ? s.nameKa : s.nameEn}
                  <small>
                    {t(`type.${s.type}`)} · {t(`region.${s.region}`)}
                  </small>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
