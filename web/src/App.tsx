import { lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { isLang, preferredLang, setLang } from './i18n'
import { stripLang, paths } from './lib/routes'
import { Head } from './lib/head'
import { markHydrating } from './lib/hydration'
import { organization, softwareApplication } from './lib/seo'
import { SiteLayout } from './layout/SiteLayout'
import { MapShell } from './layout/MapShell'
import { TabBar } from './layout/TabBar'
import { RouteAnnouncer } from './layout/RouteAnnouncer'
import { useLang } from './layout/useLang'
import { NotFoundPage } from './pages/NotFoundPage'

/* Every page is its own chunk: the map route loads the core plus MapLibre,
   a content route loads the core plus one small page. The prerenderer
   renders lazy pages in full through react-dom/static; it takes the SSR
   branch for the map and never touches that chunk. */
const MapPage = import.meta.env.SSR ? null : lazy(() => import('./pages/MapPage'))
const SpotsPage = lazy(() => import('./pages/SpotsPage').then((m) => ({ default: m.SpotsPage })))
const SpotPage = lazy(() => import('./pages/SpotPage').then((m) => ({ default: m.SpotPage })))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })))
const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })))
const PricingPage = lazy(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))

function RootRedirect() {
  return <Navigate to={paths.map(preferredLang())} replace />
}

/** Keeps i18n and <html data-app> in step with the URL. */
function LangLayout() {
  const { lang: raw } = useParams()
  const lang = useLang()
  const { pathname } = useLocation()
  const isMap = stripLang(pathname) === ''

  useLayoutEffect(() => {
    setLang(lang)
    document.documentElement.dataset.app = isMap ? 'map' : 'site'
  }, [lang, isMap])

  if (!isLang(raw)) {
    return (
      <SiteLayout>
        <NotFoundPage />
      </SiteLayout>
    )
  }
  return <Outlet />
}

function MapRoute() {
  const { t } = useTranslation()
  const lang = useLang()
  const description = t('seo.map.description')
  return (
    <>
      <Head
        title={t('app.tagline')}
        description={description}
        path={paths.map(lang)}
        lang={lang}
        jsonLd={[organization(lang), softwareApplication(lang, description)]}
      />
      {MapPage ? (
        <Suspense fallback={<MapShell />}>
          <MapPage />
        </Suspense>
      ) : (
        <MapShell />
      )}
      <TabBar />
    </>
  )
}

export default function App() {
  // Hydration is over once the first effects run.
  useEffect(() => markHydrating(false), [])
  return (
    <>
      <Routes>
        <Route index element={<RootRedirect />} />
        <Route path=":lang" element={<LangLayout />}>
          <Route index element={<MapRoute />} />
          <Route element={<SiteLayout />}>
            <Route path="spots" element={<SpotsPage />} />
            <Route path="spots/:id" element={<SpotPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="checkout/:plan" element={<CheckoutPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      <RouteAnnouncer />
    </>
  )
}
