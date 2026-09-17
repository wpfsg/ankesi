import { Suspense, type ReactNode } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { SPOTS } from '../data/spots'
import { paths } from '../lib/routes'
import { useLiveScores } from '../lib/useLiveScores'
import { useSession } from '../lib/useSession'
import { useProfile } from '../lib/useProfile'
import { Header } from '../components/Header'
import { Footer } from './Footer'
import { TabBar } from './TabBar'
import { useLang } from './useLang'

/* Content sits below the fixed glass header and, on phones, above the tab bar. */
const Main = styled.main`
  min-height: 60vh;
  padding-top: var(--header-h, 72px);
  outline: none;
`

/* Soft colour behind the glass so the blur has something to refract, like
   the map does for its floating panels. Fixed, decorative, never scrolls. */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
  background: var(--bg);

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    opacity: 0.55;
  }

  &::before {
    width: 62vmax;
    height: 62vmax;
    left: -22vmax;
    top: -24vmax;
    background: radial-gradient(circle, color-mix(in srgb, var(--accent) 42%, transparent), transparent 70%);
  }

  &::after {
    width: 56vmax;
    height: 56vmax;
    right: -20vmax;
    bottom: -18vmax;
    background: radial-gradient(circle, color-mix(in srgb, var(--pri) 38%, transparent), transparent 70%);
  }

  :root[data-theme='dark'] &::before,
  :root[data-theme='dark'] &::after {
    opacity: 0.32;
  }
`

const Pending = styled.div`
  min-height: 60vh;
`

const SkipLink = styled.a`
  position: absolute;
  left: 12px;
  top: -100px;
  z-index: 100;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--pri);
  color: var(--pri-fg);
  font-weight: 650;
  text-decoration: none;

  &:focus {
    top: 12px;
  }
`

/** Shell for every content route: the same header as the map (search opens
 *  a spot's page), the page, the footer and the phone tab bar. */
export function SiteLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const lang = useLang()
  const navigate = useNavigate()
  const live = useLiveScores()
  const { user } = useSession()
  const { displayName } = useProfile(user)
  return (
    <>
      <Backdrop aria-hidden="true" />
      <SkipLink href="#main">{t('nav.skip')}</SkipLink>
      <Header
        spots={SPOTS}
        results={live.results ?? {}}
        user={user}
        displayName={displayName}
        onSelect={(id) => navigate(paths.spot(lang, id))}
        onAccount={() => navigate(paths.account(lang))}
      />
      <Main id="main" tabIndex={-1}>
        <Suspense fallback={<Pending aria-busy="true" />}>{children ?? <Outlet />}</Suspense>
      </Main>
      <Footer />
      <TabBar />
    </>
  )
}
