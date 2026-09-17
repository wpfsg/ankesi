# Ankesi (ანკესი) — web app

Fishing conditions for Georgia. Georgian first, English second. Full-screen
map with a glass UI. Milestone 1: frontend only, all data fetched live in the
browser from public sources.

## Run

```sh
npm install
npm run dev        # http://localhost:5173/ka  or  /en
npm run build      # type-check + production bundle in dist/
```

## Verify in a real browser

`scripts/verify.mjs` drives the local Google Chrome with puppeteer-core,
takes screenshots (phone / desktop, ka / en, light / dark), opens a spot,
toggles language, opens the trip planner, and prints console errors and
failed requests.

```sh
npm run dev &
node scripts/verify.mjs http://localhost:5173 ./shots
```

## Deployment

Every push to `main` builds and publishes the app to GitHub Pages through
`.github/workflows/pages.yml`: https://wpfsg.github.io/ankesi/

- The build runs with `VITE_BASE=/ankesi/` so assets and language URLs live
  under the project path. On a custom domain set `VITE_BASE=/` and add a
  `CNAME` file to `public/`.
- Every route is prerendered to its own `index.html`, so deep links are real
  200s. Unknown paths get the prerendered `404.html`, which boots the app for
  client-only routes.
- To enable accounts on the live site, add `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` as repository secrets and add the Pages origin to
  the Supabase redirect URLs.

## Where the data comes from

| Data | Source | Real or estimate |
|---|---|---|
| Pressure, temperature, wind, cloud, rain (hourly, 7 days back, 3 ahead) | Open-Meteo forecast API | real |
| Wave height, sea surface temperature (sea spots) | Open-Meteo Marine API | real |
| Sunrise, sunset, moon phase | SunCalc | exact |
| Map | OpenFreeMap / OpenStreetMap | real |
| Water temperature (lakes, rivers) | derived from 7-day air temperature by depth class | estimate, labeled |
| Water level / clarity | derived from 48 h rainfall until river gauges are wired | estimate, labeled |
| Activity score | weighted model over the above, breakdown always shown | model v0.2, hand-set weights |

## Layout

```
src/
  App.tsx             routes: language layout, map route, content pages (lazy)
  entry-server.tsx    prerender entry (react-dom/static + styled-components SSR)
  pages/              MapPage (the app), SpotsPage, SpotPage, HowItWorks, Faq, Pricing, Checkout, Reports, NotFound
  layout/             SiteHeader (+ slide-over menu), Footer, TabBar, Breadcrumbs, RouteAnnouncer, MapShell
  data/spots.ts       108 spots across Georgia, ka/en names, species mix (coords approximate)
  data/species.ts     species with ka/en names, temperature ranges, seasons
  content/            faq.ts (question ids and groups), pricing.ts (plans, feature matrix)
  lib/weather.ts      one Open-Meteo call for all spots
  lib/marine.ts       one Marine API call for sea spots
  lib/scoring.ts      factors, weights, bands, best window
  lib/routes.ts       every URL is built here; lib/staticRoutes.ts lists what gets prerendered
  lib/head.tsx        per-route title, meta, canonical, hreflang, OG, JSON-LD
  lib/snapshot.ts     build-time score snapshot shared by prerender and hydration
  lib/format.ts       Tbilisi-time formatting, distance, drive-time estimate
  i18n/ka.ts          source language
  i18n/en.ts          translation, typed against ka
  components/         MapView, Header, SpotSheet, ScoreStrip, FactorList, TripPlanner, StaticMap, SpotCard
  components/score/   ScoreHero, BestWindowCard, FactorImpacts — shared by the panel and spot pages
  styles/page.ts      layout primitives for content routes
```

## Site structure (information architecture)

The map stays at the language root. Content pages live around it, are
prerendered to static HTML at build time, and share the map's design
tokens, theme and i18n. Every route exists for `/ka` and `/en` with the
same slug; canonical and `hreflang` tags pair them.

| Route | What | Rendered |
|---|---|---|
| `/` | Redirect to `/ka` or `/en` (saved choice, then browser language) | static stub |
| `/:lang` | The map app. `?spot=<id>` opens a spot, `?account=1` the account sheet | client chunk, shell prerendered |
| `/:lang/spots` | Catalog with region, water type, species filters and today's score | prerendered |
| `/:lang/spots/:id` | One spot: score, best window, 48 h, factors, season, species, access, rules, reports, nearby | prerendered, per-spot OG card |
| `/:lang/how-it-works` | Methodology: the 9 factors, weights, sources, confidence, limits | prerendered |
| `/:lang/faq` | Grouped accordion with `#anchors` and FAQPage schema | prerendered |
| `/:lang/pricing` | Free vs Premium, plans, comparison, billing FAQ | prerendered |
| `/:lang/checkout/:plan` | Stub: launch-list email capture, `noindex` | prerendered |
| `/:lang/reports` | Community reports feed | prerendered shell, client data |
| `*` | Localized 404, also served as `404.html` | prerendered |

Region and species hubs (`/regions/:slug`, `/species/:slug`) are phase 2;
until then `paths.region()` and `paths.species()` in `src/lib/routes.ts`
point at the filtered catalog, so the switch is one line.

### How the build works

```
tsc -b && vite build                        # client: core + one chunk per page + the map chunk
vite build --ssr src/entry-server.tsx       # renderer for Node (dist-ssr/)
node scripts/prerender.mjs                  # fetches Open-Meteo once, scores all spots,
                                            # renders 2 × every route into dist/<lang>/<path>/index.html,
                                            # writes sitemap.xml, robots.txt, 404.html and the root redirect
node scripts/og.mjs                         # 1200×630 PNG per spot and language into dist/og/
```

`npm run build` runs all four. The score snapshot is embedded in each page
(`window.__ANKESI_SNAPSHOT__`), so the static HTML shows a real score with
its time, the browser hydrates from the same data, then `useLiveScores`
refreshes live. The Pages workflow also runs on a daily schedule so
prerendered scores and cards stay current.

Screenshots of every page at 390 px and 1440 px, with console errors:

```sh
npm run serve &              # serves dist/ on :4173 the way GitHub Pages does
npm run shots                # writes shots/*.png
```

`vite preview` is not suitable here: it treats every extensionless path as
an SPA fallback and would serve the root redirect for every page.

### Adding a page

1. Create `src/pages/MyPage.tsx`. Use the primitives in
   `src/styles/page.ts` (`Page`, `PageHead`, `H1`, `Lead`, `Section`, `Card`,
   `Prose`, `ButtonLink`), render `<Breadcrumbs>` and a `<Head>` with title,
   description, `path` and `jsonLd` (helpers in `src/lib/seo.ts`).
2. Add the path builder to `paths` in `src/lib/routes.ts` and, if it belongs
   in the header, to `NAV_ITEMS` (max five). Footer links live in
   `src/layout/Footer.tsx`.
3. Register the route in `src/App.tsx` as a `lazy()` import inside the
   `SiteLayout` group.
4. Add it to `staticRoutes()` in `src/lib/staticRoutes.ts` so it is
   prerendered and listed in the sitemap (`noindex: true` keeps it out).
5. Never read `window`, `localStorage` or the URL query during the first
   render: the page must render identically on the server. Read them in an
   effect, or guard with `isHydrating()` from `src/lib/hydration.ts`. Avoid
   locale-dependent `Intl` output in prerendered text (month names, decimal
   separators): Node and browsers ship different ICU data, so use i18n keys
   or fixed formatting as `fmtGel` and `monthName` do.

### Adding copy in both languages

All strings live in `src/i18n/ka.ts` (source) and `src/i18n/en.ts`, which
is typed against Georgian: a key missing in English fails `tsc`. Add the key
under the page's namespace (`spots`, `spot`, `how`, `faq`, `pricing`, …) in
both files and use `t('namespace.key')`. FAQ questions are keyed by the ids
in `src/content/faq.ts`; plans and features by the ids in
`src/content/pricing.ts`. Georgian has no capital letters, so never apply
`text-transform: uppercase`.

### Environment

| Variable | Purpose |
|---|---|
| `VITE_BASE` | Deployment base path (`/ankesi/` on the project page, `/` on a domain) |
| `VITE_SITE_ORIGIN` | Absolute origin for canonical, hreflang, sitemap and OG URLs |
| `VITE_CONTACT_EMAIL` | Contact address on the FAQ page (falls back to the GitHub issues link) |
| `CHROME_PATH` | Chrome binary for `scripts/og.mjs` and `scripts/shots.mjs` |

## Milestone 2: accounts and community (Supabase)

Set up once following [`../supabase/SETUP.md`](../supabase/SETUP.md), then put
the project URL and anon key in `.env.local` (see `.env.example`). Without
them the app runs read-only and account features show a notice.

What the backend adds:
- Sign in with a magic link or Google. Browsing never requires an account.
- Catch log with photo, weight, length, bait, method, note, private by default.
  The current score, factors, and water temperature are attached to every catch.
- Community reports (dead … great) per spot. Recent reports shift the spot's
  score by up to ±15 points with a 48 h half-life and raise confidence to
  "high" at three or more reports. Three flags hide a report.
- Saved spots (alerts come in milestone 3).
- Paid pond submissions by owners, shown on the map after moderation.
- Hourly weather history via the `snapshot` edge function, for refitting the
  model weights against real catches.

Files: `src/lib/supabase.ts`, `src/lib/db.ts`, `src/lib/useSession.ts`,
`src/components/{AccountSheet,CatchForm,ReportForm,MyCatches,PaidPondForm,ModalSheet}.tsx`,
`../supabase/migrations/0001_init.sql`, `../supabase/seed.sql`
(regenerate with `node scripts/gen-seed.mjs`), `../supabase/functions/snapshot/`.

## Known gaps before launch

- Regulations and closed seasons are not verified; the UI says so.
- Spot coordinates are approximate; check each against OpenStreetMap.
- Georgian species names need a native-speaker review.
- Browsers cannot read a phone barometer; a manual reading field is provided.
- Accounts, catch log, community reports, paid-pond submissions, and push
  alerts are milestone 2 and 3 (Supabase). See `../docs/MVP_SPEC.md`.
