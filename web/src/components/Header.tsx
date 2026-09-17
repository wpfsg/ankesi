import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import type { Spot, SpotResult } from '../types'
import { Link } from 'react-router'
import type { Lang } from '../i18n'
import { bandOf } from '../lib/scoring'
import { paths } from '../lib/routes'
import { displayNameOf, initialOf } from '../lib/displayName'
import { signOut } from '../lib/useSession'
import { MiniBubble } from '../styles/shared'
import { LangSwitch, NavLinks } from '../layout/Nav'
import { ThemeToggle } from './ThemeToggle'
import {
  AccountBtn,
  AccountLabel,
  AccountWrap,
  Avatar,
  Brand,
  BrandCol,
  BrandName,
  HeaderActions,
  HeaderResults,
  HeaderRoot,
  HeaderRow,
  Menu,
  MenuHead,
  MenuItem,
  NavSlot,
  PillIcon,
  Result,
  ResultName,
  ResultsHead,
  ResultsList,
  Search,
} from './Header.styles'

interface Props {
  spots: Spot[]
  results: Record<string, SpotResult>
  user: User | null
  /** Saved profile name; falls back to the auth provider's name or email. */
  displayName?: string
  onSelect: (id: string) => void
  /** Signed out: what the account button does — the map opens its sheet,
   *  content pages go to the account page. Signed in, the button opens the
   *  account menu instead. */
  onAccount: () => void
}

/** Fixed glass header: brand, links, search, theme, language and account.
 *  Used by the map and by every content page. Publishes its height as
 *  --header-h so the bottom sheet, pills and page content sit below it. */
export function Header({ spots, results, user, displayName, onSelect, onAccount }: Props) {
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

  // Account menu: opens on the avatar, closes on Escape, on a click outside
  // and on picking an item.
  const [menuOpen, setMenuOpen] = useState(false)
  const accountWrap = useRef<HTMLDivElement>(null)
  const accountBtn = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (accountWrap.current?.contains(target) || menu.current?.contains(target)) return
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    // Opening with the keyboard should land on the first item.
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [menuOpen])

  const onMenuKeys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMenuOpen(false)
      accountBtn.current?.focus()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const next = items.indexOf(document.activeElement as HTMLElement) + (e.key === 'ArrowDown' ? 1 : -1)
    items[(next + items.length) % items.length]?.focus()
  }

  const q = query.trim().toLowerCase()

  const nameOf = useCallback((s: Spot) => (lang === 'ka' ? s.nameKa : s.nameEn), [lang])

  // Empty field: every spot, A→Z, so the dropdown is a browsable list.
  // Typing filters it.
  const matches = useMemo(() => {
    if (!q) return [...spots].sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang))
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
      .sort((a, b) => rank(a) - rank(b) || nameOf(a).localeCompare(nameOf(b), lang))
  }, [q, spots, t, lang, nameOf])

  // Opens on focus, not just on a query: clicking the field shows the spots.
  const showResults = focused

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
    <>
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
            role="combobox"
            aria-expanded={showResults}
            aria-controls="header-search-results"
            aria-autocomplete="list"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </Search>

        <HeaderActions>
        <ThemeToggle />

        <LangSwitch />

        <AccountWrap ref={accountWrap}>
          <AccountBtn
            ref={accountBtn}
            type="button"
            onClick={() => (user ? setMenuOpen((open) => !open) : onAccount())}
            aria-label={t('account.open')}
            aria-haspopup={user ? 'menu' : undefined}
            aria-expanded={user ? menuOpen : undefined}
          >
            {user ? (
              <Avatar>{initialOf(displayName || displayNameOf(user))}</Avatar>
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
        </AccountWrap>
        </HeaderActions>
      </HeaderRow>
      </HeaderRoot>

      {menuOpen && user && (
        <Menu ref={menu} role="menu" aria-label={t('account.title')} onKeyDown={onMenuKeys}>
          <MenuHead>
            <strong>{displayName || displayNameOf(user)}</strong>
            <small>{user.email}</small>
          </MenuHead>
          <MenuItem as={Link} role="menuitem" to={paths.account(lang)} onClick={closeMenu}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            {t('account.profile')}
          </MenuItem>
          <MenuItem
            as="button"
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu()
              void signOut()
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <path d="M15 17l5-5-5-5M20 12H9M12 3H5v18h7" />
            </svg>
            {t('profile.signOut')}
          </MenuItem>
        </Menu>
      )}

      {showResults && (
        // Keep the field focused when the panel or its scrollbar is grabbed.
        <HeaderResults onMouseDown={(e) => e.preventDefault()}>
          <ResultsHead>
            {q ? t('search.matches') : t('search.all')}
            <span>{matches.length}</span>
          </ResultsHead>
          <ResultsList id="header-search-results" role="listbox" aria-label={q ? t('search.matches') : t('search.all')}>
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
                    {nameOf(s)}
                    <small>
                      {t(`type.${s.type}`)} · {t(`region.${s.region}`)}
                    </small>
                  </ResultName>
                </Result>
              )
            })}
          </ResultsList>
        </HeaderResults>
      )}
    </>
  )
}