import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router'
import { paths } from '../lib/routes'
import { useLang } from './useLang'
import { TabNav } from './TabBar.styles'

const IconMap = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

const IconList = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
)

const IconBubble = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 12a8 8 0 0 1-8 8H5.5L4 21.5V12a8 8 0 1 1 16 0z" />
  </svg>
)

const IconUser = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

/** Phone tab bar for the map route: Map · Spots · Reports · Account. */
export function TabBar() {
  const { t } = useTranslation()
  const lang = useLang()
  return (
    <TabNav aria-label={t('nav.tabs')}>
      <NavLink to={paths.map(lang)} end>
        {IconMap}
        <span>{t('nav.map')}</span>
      </NavLink>
      <NavLink to={paths.spots(lang)}>
        {IconList}
        <span>{t('nav.spots')}</span>
      </NavLink>
      <NavLink to={paths.reports(lang)}>
        {IconBubble}
        <span>{t('nav.reports')}</span>
      </NavLink>
      <Link to={paths.account(lang)}>
        {IconUser}
        <span>{t('nav.account')}</span>
      </Link>
    </TabNav>
  )
}
