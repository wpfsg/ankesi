import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Report, Spot, SpotResult, SpotWeather } from './types'
import type { Lang } from './i18n'
import { SPOTS } from './data/spots'
import { fetchWeatherForSpots } from './lib/weather'
import { fetchMarineForSpots } from './lib/marine'
import { applyCommunity, scoreSpot } from './lib/scoring'
import { fmtTime } from './lib/format'
import { hasBackend } from './lib/supabase'
import { useSession } from './lib/useSession'
import { fetchApprovedPonds, fetchRecentReports, fetchSavedSpotIds, flagReport, setSaved } from './lib/db'
import { MapView } from './components/MapView'
import { Header } from './components/Header'
import { Splash } from './components/Splash'
import { TripPlanner } from './components/TripPlanner'
import { SpotSheet, type SpotAction } from './components/SpotSheet'
import { AccountSheet } from './components/AccountSheet'
import { CatchForm } from './components/CatchForm'
import { ReportForm } from './components/ReportForm'
import { MyCatches } from './components/MyCatches'
import { PaidPondForm } from './components/PaidPondForm'

const REFRESH_MS = 60 * 60 * 1000
const TICK_MS = 5 * 60 * 1000
/** The splash never blocks longer than this, even if tiles are slow. */
const SPLASH_MAX_MS = 12_000

type Modal = 'account' | 'catch' | 'report' | 'pond' | 'mycatches' | null

export default function App() {
  const { t, i18n } = useTranslation()
  const lang: Lang = i18n.language === 'en' ? 'en' : 'ka'
  const { user } = useSession()

  const [ponds, setPonds] = useState<Spot[]>([])
  const spots = useMemo(() => [...SPOTS, ...ponds], [ponds])
  const spotsById = useMemo(() => Object.fromEntries(spots.map((s) => [s.id, s])) as Record<string, Spot>, [spots])

  const [weather, setWeather] = useState<Record<string, SpotWeather> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [manual, setManual] = useState<Record<string, number>>({})
  const [reports, setReports] = useState<Record<string, Report[]>>({})
  const [saved, setSavedIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<Modal>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [splashTimedOut, setSplashTimedOut] = useState(false)

  const showSplash = !splashTimedOut && !(mapReady && (weather !== null || error !== null))

  useEffect(() => {
    const id = window.setTimeout(() => setSplashTimedOut(true), SPLASH_MAX_MS)
    return () => window.clearTimeout(id)
  }, [])

  const say = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3500)
  }

  // Weather for every spot, incl. ponds once they arrive.
  const load = useCallback(async (list: Spot[]) => {
    setLoading(true)
    setError(null)
    try {
      const [rows, marine] = await Promise.all([
        fetchWeatherForSpots(list),
        fetchMarineForSpots(list).catch(() => ({}) as Record<string, never>),
      ])
      const byId: Record<string, SpotWeather> = {}
      for (const w of rows) byId[w.spotId] = { ...w, marine: marine[w.spotId] }
      setWeather(byId)
      setNow(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(spots)
    const refresh = window.setInterval(() => void load(spots), REFRESH_MS)
    const tick = window.setInterval(() => setNow(new Date()), TICK_MS)
    return () => {
      window.clearInterval(refresh)
      window.clearInterval(tick)
    }
  }, [load, spots])

  // Community reports and approved ponds, when a backend is configured.
  const loadReports = useCallback(async () => {
    if (!hasBackend) return
    try {
      const list = await fetchRecentReports()
      const by: Record<string, Report[]> = {}
      for (const r of list) (by[r.spotId] ??= []).push(r)
      setReports(by)
    } catch {
      // keep the previous reports; scores still work without them
    }
  }, [])

  useEffect(() => {
    void loadReports()
    if (!hasBackend) return
    fetchApprovedPonds()
      .then(setPonds)
      .catch(() => undefined)
    const id = window.setInterval(() => void loadReports(), 10 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [loadReports])

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set())
      return
    }
    fetchSavedSpotIds(user.id)
      .then(setSavedIds)
      .catch(() => undefined)
  }, [user])

  useEffect(() => {
    document.title = `${t('app.title')} · ${t('app.tagline')}`
  }, [t, i18n.language])

  const results = useMemo(() => {
    const out: Record<string, SpotResult> = {}
    if (!weather) return out
    for (const spot of spots) {
      const w = weather[spot.id]
      if (!w) continue
      const base = scoreSpot(spot, w, { manualPressure: manual[spot.id], now })
      out[spot.id] = applyCommunity(base, reports[spot.id] ?? [], now)
    }
    return out
  }, [weather, manual, now, spots, reports])

  const selected = selectedId ? spotsById[selectedId] : null
  const fetchedAt = weather ? Object.values(weather)[0]?.fetchedAt : undefined
  const snap = selected
    ? { hour: results[selected.id]?.hours[0], waterTemp: results[selected.id]?.waterTemp }
    : { hour: undefined, waterTemp: undefined }

  const onAction = (kind: SpotAction) => {
    if (!selected) return
    if (!hasBackend || !user) {
      setModal('account')
      return
    }
    if (kind === 'save') {
      const next = !saved.has(selected.id)
      setSavedIds((s) => {
        const copy = new Set(s)
        if (next) copy.add(selected.id)
        else copy.delete(selected.id)
        return copy
      })
      setSaved(selected.id, next, user.id).catch(() => say(t('common.error')))
      return
    }
    setModal(kind)
  }

  const unsave = (id: string) => {
    if (!user) return
    setSavedIds((s) => {
      const copy = new Set(s)
      copy.delete(id)
      return copy
    })
    setSaved(id, false, user.id).catch(() => undefined)
  }

  const savedSpots = spots.filter((s) => saved.has(s.id))

  return (
    <>
      <MapView
        spots={spots}
        results={results}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onReady={() => setMapReady(true)}
      />

      <Header spots={spots} results={results} user={user} onSelect={setSelectedId} onAccount={() => setModal('account')} />

      <div className="top">
        <div className="top-row">
          <TripPlanner spots={spots} results={results} onSelect={setSelectedId} />
        </div>
        {loading && !weather && <div className="toast glass">{t('status.loading')}</div>}
        {error && (
          <div className="toast glass">
            {t('status.error')}
            <button type="button" onClick={() => void load(spots)}>
              {t('status.retry')}
            </button>
          </div>
        )}
        {flash && <div className="toast glass">{flash}</div>}
        {!error && !flash && fetchedAt && !selected && (
          <div className="toast glass">{t('status.updated', { time: fmtTime(fetchedAt, lang) })}</div>
        )}
      </div>

      {selected && (
        <SpotSheet
          spot={selected}
          result={results[selected.id]}
          reports={reports[selected.id] ?? []}
          saved={saved.has(selected.id)}
          manualPressure={manual[selected.id]}
          onManualPressure={(v) =>
            setManual((m) => {
              const next = { ...m }
              if (v === undefined) delete next[selected.id]
              else next[selected.id] = v
              return next
            })
          }
          onAction={onAction}
          onFlag={(id) => flagReport(id).catch(() => undefined)}
          onClose={() => setSelectedId(null)}
        />
      )}

      <AnimatePresence>
        {modal === 'account' && (
          <AccountSheet
            key="account"
            user={user}
            lang={lang}
            savedSpots={savedSpots}
            onClose={() => setModal(null)}
            onOpenCatches={() => setModal('mycatches')}
            onOpenPond={() => setModal('pond')}
            onSelectSpot={(id) => {
              setSelectedId(id)
              setModal(null)
            }}
            onUnsave={unsave}
          />
        )}
        {modal === 'catch' && selected && user && (
          <CatchForm
            key="catch"
            spot={selected}
            snap={snap}
            userId={user.id}
            lang={lang}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null)
              say(t('catch.saved'))
            }}
          />
        )}
        {modal === 'report' && selected && user && (
          <ReportForm
            key="report"
            spot={selected}
            snap={snap}
            userId={user.id}
            onClose={() => setModal(null)}
            onSent={() => {
              setModal(null)
              say(t('report.sent'))
              void loadReports()
            }}
          />
        )}
        {modal === 'mycatches' && user && (
          <MyCatches key="mycatches" userId={user.id} spotsById={spotsById} lang={lang} onClose={() => setModal(null)} />
        )}
        {modal === 'pond' && user && (
          <PaidPondForm key="pond" userId={user.id} onClose={() => setModal(null)} onSubmitted={() => undefined} />
        )}
      </AnimatePresence>

      <AnimatePresence>{showSplash && <Splash key="splash" stage={mapReady ? 'weather' : 'map'} />}</AnimatePresence>
    </>
  )
}
