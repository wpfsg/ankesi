import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router'
import { LANGS, type Lang } from '../i18n'
import { NAV_ITEMS, paths, switchLang } from '../lib/routes'
import { useLang } from './useLang'
import { LangLinks, NavList } from './Nav.styles'

interface NavProps {
  /** Header shows the primary links; the drawer and footer show everything. */
  variant?: 'primary' | 'all'
  onNavigate?: () => void
}

/** The site's navigation links as real anchors with aria-current. */
export function NavLinks({ variant = 'primary', onNavigate }: NavProps) {
  const { t } = useTranslation()
  const lang = useLang()
  const items: { key: string; to: string; end?: boolean }[] = NAV_ITEMS.map((i) => ({
    key: i.key,
    to: i.to(lang),
    end: i.key === 'map',
  }))
  if (variant === 'all') {
    items.push(
      { key: 'pricing', to: paths.pricing(lang) },
      { key: 'reports', to: paths.reports(lang) },
      { key: 'faq', to: paths.faq(lang) },
    )
  }
  return (
    <NavList>
      {items.map((i) => (
        <li key={i.key}>
          <NavLink to={i.to} end={i.end} onClick={onNavigate}>
            {t(`nav.${i.key}`)}
          </NavLink>
        </li>
      ))}
    </NavList>
  )
}

/** ქა / EN as links to the same page in the other language. */
export function LangSwitch({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const lang = useLang()
  const { pathname, search, hash } = useLocation()
  return (
    <LangLinks role="group" aria-label={t('nav.language')}>
      {LANGS.map((l: Lang) => (
        <Link
          key={l}
          to={`${switchLang(pathname, l)}${search}${hash}`}
          lang={l}
          hrefLang={l}
          aria-current={l === lang ? 'true' : undefined}
          onClick={onNavigate}
        >
          {t(`lang.${l}`)}
        </Link>
      ))}
    </LangLinks>
  )
}
