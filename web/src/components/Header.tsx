import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import type { Spot, SpotResult } from '../types'
import { Link } from 'react-router'
import type { Lang } from '../i18n'
import { bandOf } from '../lib/scoring'
import { fmtTime } from '../lib/format'
import { paths } from '../lib/routes'
import { displayNameOf } from '../lib/displayName'
import { MiniBubble } from '../styles/shared'
import { LangSwitch, NavLinks } from '../layout/Nav'
import { ThemeToggle } from './ThemeToggle'
import {
  AccountBtn,
  AccountLabel,
  Avatar,
  Brand,
  BrandCol,
  BrandName,
  HeaderActions,
  HeaderResults,
  HeaderRoot,
  HeaderRow,
  NavSlot,
  PremiumLink,
  Updated,
  PillIcon,
  Result,
  ResultName,
  Search,
} from './Header.styles'

interface Props {
  spots: Spot[]
  results: Record<string, SpotResult>
  user: User | null
  onSelect: (id: string) => void
  onAccount: () => void
  /** When the weather was last fetched; shown next to the controls. */
  updatedAt?: Date
}

/** Fixed glass header: brand, links, search, theme, language, Premium,
 *  account. Used by the map and by every content page. Publishes its height
 *  as --header-h so the bottom sheet, pills and page content sit below it. */
export function Header({ spots, results, user, onSelect, onAccount, updatedAt }: Props) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'en' ? 'en' : 'ka') as Lang
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
    if (showResults) document.documentElement.dataset.searching = 'true'
    else delete document.documentElement.dataset.searching
    return () => {
      delete document.documentElement.dataset.searching
    }
  }, [showResults])

  // Starts wide so the prerendered markup matches; narrows after mount.
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    setNarrow(mq.matches)
    const on = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const placeholder = narrow ? t('search.placeholderShort') : t('search.placeholder')

  return (
    <HeaderRoot ref={ref}>
      <HeaderRow>
        <BrandCol>
          <Brand as={Link} to={paths.map(lang)} aria-label={t('nav.home')}>
            <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="var(--accent)" />
              <path d="M17 34c7-11 22-11 29 0-7 11-22 11-29 0z" fill="var(--accent-fg)" />
              <circle cx="39" cy="33" r="2.4" fill="var(--accent)" />
            </svg>
            <BrandName>{t('app.title')}</BrandName>
          </Brand>
          <NavSlot aria-label={t('nav.primary')}>
            <NavLinks />
          </NavSlot>
        </BrandCol>

        <Search>
          <PillIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </PillIcon>
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
        </Search>

        <HeaderActions>
        {updatedAt && <Updated>{t('status.updated', { time: fmtTime(updatedAt, lang) })}</Updated>}
        <ThemeToggle />

        <LangSwitch />

        <PremiumLink to={paths.pricing(lang)}>{t('nav.premium')}</PremiumLink>

        <AccountBtn type="button" onClick={onAccount} aria-label={t('account.open')}>
          {user ? (
            <Avatar>{(displayNameOf(user)[0] ?? '?').toUpperCase()}</Avatar>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <AccountLabel>{t('account.signIn')}</AccountLabel>
            </>
          )}
        </AccountBtn>
        </HeaderActions>
      </HeaderRow>

      {showResults && (
        <HeaderResults role="listbox">
          {matches.length === 0 && <Result as="div" $muted>{t('search.noResults')}</Result>}
          {matches.map((s) => {
            const score = results[s.id]?.hours[0]?.score
            return (
              <Result
                key={s.id}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(s.id)
                  setQuery('')
                  setFocused(false)
                }}
              >
                <MiniBubble data-band={bandOf(score)}>
                  {score ?? '·'}
                </MiniBubble>
                <ResultName>
                  {lang === 'ka' ? s.nameKa : s.nameEn}
                  <small>
                    {t(`type.${s.type}`)} · {t(`region.${s.region}`)}
                  </small>
                </ResultName>
              </Result>
            )
          })}
        </HeaderResults>
      )}
    </HeaderRoot>
  )
}
