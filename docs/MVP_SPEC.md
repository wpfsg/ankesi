# Ankesi (ანკესი) — Fishing Conditions App for Georgia

Working name. "Ankesi" means fishing hook / fishing rod in Georgian. Rename freely.

Status: MVP specification, draft 2, 2026-09-15.
Platform: web app (mobile-first, installable PWA). No native apps in MVP.
Languages: Georgian (default) and English.
UI: minimalist, iOS "liquid glass" style. Full-screen map, translucent
floating panels, very little chrome. See section 9.
Initial region: Tbilisi and everything within ~2 hours by car.

---

## 1. Product principle

**Every number in the app is real or clearly labeled as an estimate.**

There is no sensor that measures "fish activity". The activity index is a
model built from measured inputs (pressure, temperature, wind, water level,
sun, moon) and corrected over time by user catch reports. The app always
shows the breakdown and the data source behind the score. This is the
differentiator against apps that show a bare "78% bite chance" with no
explanation.

---

## 2. Target users

1. Tbilisi shore anglers who fish Tbilisi Sea, Lisi, Kumisi, Mtkvari on
   weekends. Mostly carp, catfish, crucian carp. Georgian-speaking.
2. Trout anglers driving to Aragvi, Algeti, Tsalka on day trips.
3. Paid-pond (ფასიანი ტბა) regulars around Tbilisi.
4. Tourists and foreign residents who want to fish and do not read Georgian.

---

## 3. Feature list for MVP

### 3.1 Map
- Vector basemap (MapLibre GL + OpenFreeMap tiles, or MapTiler free tier).
- Water layer from OpenStreetMap: lakes, reservoirs, rivers, canals.
- Spot pins with a color-coded activity index (grey = no data, red / yellow /
  green bands).
- Tap a spot to open the spot sheet.
- Layers toggle: parking, roads and tracks, protected areas, paid ponds.
- "Near me" button and search by spot name in either language.

### 3.2 Spot sheet
- Name (ka / en), type (lake, reservoir, river, paid pond), photo.
- Activity index now + next 48 hours as an hourly bar strip.
- Breakdown table: each factor, its current value, its contribution, its
  source and timestamp.
- Water: level or discharge trend (rising / stable / falling), estimated
  water temperature, clarity guess after rain.
- Species typically caught here, with season hint.
- Access notes: shore access, parking, walking distance, fee if paid pond.
- Regulations for this water body: closed season, size limits, any special
  restriction (for example, drinking water reservoir rules at Tbilisi Sea).
- Recent community reports (last 7 days).
- Buttons: Log a catch, Post a report, Navigate (opens Google Maps / Waze).

### 3.3 Activity index (details in section 5)
- Score 0–100 per spot per hour.
- Confidence label: low / medium / high, driven by data freshness and number
  of recent reports for that spot.
- Plain-language summary in the user's language, e.g.
  ka: "წნევა სტაბილურია, წყალი კლებულობს — კარგი დილაა კობრისთვის."
  en: "Stable pressure, falling water — good morning for carp."

### 3.4 Best windows
- Daily view: for each spot, the top two 2–3 hour windows in the next 48 h.
- Home screen card: "Best today near you".

### 3.5 Species guide
- Georgian and English names, photo, legal minimum size, season, typical
  baits and methods, where found. See species table in section 7.

### 3.6 Regulations and closed seasons
- Static content per water body plus national rules.
- Maintained by hand from the Ministry of Environmental Protection and
  Agriculture and the Department of Environmental Supervision. Never
  scraped blindly. Each rule has a "last verified" date visible to users.
- Push notification 7 days and 1 day before a closed season starts.

### 3.7 Catch log
- Photo, species, weight, length, bait, method, spot, time.
- Weather and water snapshot attached automatically at save time.
- Private by default. Toggle to share to the spot's community feed.
- Personal stats: catches per species, per spot, per month.

### 3.8 Community reports
- Short report: activity (dead / slow / ok / good / great), species seen,
  optional note and photo.
- Reports feed back into the index for that spot (section 5.4).
- Basic moderation: report abuse, shadow-hide after N flags.

### 3.9 Offline mode (PWA)
- Service worker caches the app shell, the last-viewed map tiles, spot data
  and the 48 h forecast for spots the user has opened.
- Catch log and reports queue in IndexedDB and sync when back online.
- Full region download is out of MVP scope; browsers limit tile caching.

### 3.10 Localization
- Georgian (ka) is the default and the first language written for every
  string. English (en) is a translation, not the other way around.
- Language follows device locale on first launch, switchable in settings.
- See section 8 for implementation details.

### Not in MVP (later)
- Russian language.
- Paid tier (7-day forecast, unlimited history, offline unlimited).
- Tackle shop and guide directory.
- Boat / kayak spots and sea fishing on the Black Sea coast.
- Social features beyond the spot feed.

---

## 4. Data sources

| Data | Source | Refresh | Notes |
|---|---|---|---|
| Air temp, pressure, wind, cloud, precipitation, humidity | Open-Meteo forecast API | hourly | Free, no key, per coordinate. Pull for each spot. |
| Historical weather (for model tuning) | Open-Meteo archive API | nightly | Backfill 3 years for seed spots. |
| River discharge (modeled) | Open-Meteo flood API (GloFAS) | daily | Rivers only. Label as "modeled". |
| Gauge water levels | National Environmental Agency (NEA) hydrological bulletins | daily | Scrape or manual entry at first. Label as "measured". |
| Sun / moon | Astronomy library (suncalc or astral) | computed | No network needed. |
| Water bodies, roads, parking | OpenStreetMap via Overpass API | monthly | Cache as GeoJSON. Contribute fixes back to OSM. |
| Basemap tiles | OpenFreeMap or MapTiler | n/a | Check attribution requirements. |
| Water temperature | Estimated from 7-day air temp history + depth class | daily | Always labeled "estimate". Replace with user thermometer readings when available. |
| Regulations | Ministry / DES publications | manual, seasonal | Show "last verified" date. |
| Activity ground truth | User catch logs and reports | realtime | The only true signal. |

---

## 5. Activity index model

### 5.1 Inputs per spot per hour
- `p_now`: pressure hPa; `p_trend_6h`, `p_trend_24h`: change in hPa.
- `t_air`: air temp; `t_water_est`: estimated water temp.
- `wind_speed`, `wind_dir`.
- `cloud_pct`, `precip_mm_3h`, `precip_mm_48h`.
- `water_trend`: rising / stable / falling (from discharge or gauge).
- `hour_rel`: minutes from sunrise / sunset.
- `moon_phase`, `moon_transit_minutes`.
- `season_factor(species, month)`.
- `reports_7d`: recent community reports for the spot.

### 5.2 Base score (0–100)
Weights sum to 100. Each factor returns 0.0–1.0.

Weights below are model v0.2 (recalibrated 2026-09-15 after the first
real-data run: v0.1 gave "great" to a sunny midday, so time of day gained
weight and bands moved up).

| Factor | Weight | Rule of thumb |
|---|---|---|
| Pressure trend 6 h | 20 | Stable or slowly falling = 1.0. Rapid rise after a front = 0.3. Rapid fall = 0.5. |
| Pressure absolute | 5 | 1010–1020 hPa = 1.0, tails taper. |
| Water temp vs species optimum | 15 | Gaussian around species optimum (carp 20–26 °C, trout 8–16 °C). |
| Wind | 10 | 5–15 km/h = 1.0. Calm = 0.7. > 30 km/h = 0.2. |
| Cloud and light | 10 | Overcast = 1.0, bright midday sun = 0.3, night = 0.8. |
| Water level trend (sea: wave height) | 10 | Stable = 1.0. Rising after heavy rain = 0.2. Sea: flat 1.0, choppy 0.7, rough 0.25. |
| Time of day | 20 | 1.0 within 1 h of sunrise/sunset, 0.7 within 3 h, midday 0.25, night 0.5 plus nocturnal-species share. |
| Moon | 5 | New and full moon slightly higher. Small weight on purpose. |
| Season | 5 | Species-specific monthly curve. |

Bands: great ≥ 82, good ≥ 68, ok ≥ 52, slow ≥ 35, dead below.

`base = 100 * Σ (weight_i * factor_i) / 100`

### 5.3 Spot-specific species weighting
Each spot has a species mix, e.g. Tbilisi Sea: carp 0.4, catfish 0.3,
crucian 0.2, pike-perch 0.1. Compute base per species and blend by mix.

### 5.4 Community correction
`adjusted = base + clamp(k * mean(report_delta_7d), -15, +15)`
where `report_delta` maps dead/slow/ok/good/great to -2..+2 and `k` starts
at 5. Reports decay with half-life 48 h.

### 5.5 Confidence
- high: weather < 3 h old AND water data < 24 h old AND ≥ 3 reports in 7 d.
- medium: weather fresh, missing water data or fewer reports.
- low: anything stale, or spot never had a report.

### 5.6 Tuning
Log every score alongside every catch report. After the first season,
fit weights by logistic regression on "good or better" outcomes. Until
then, weights above are hand-set and shown to the user as such.

---

## 6. Seed spots (approximate centers, verify in OSM before launch)

| # | Name (ka) | Name (en) | Type | Approx lat, lon | Species | Notes |
|---|---|---|---|---|---|---|
| 1 | თბილისის ზღვა — ჩრდილოეთი ნაპირი | Tbilisi Sea, north shore | reservoir | 41.775, 44.870 | carp, catfish, crucian, pike-perch | Drinking-water reservoir: verify allowed zones. |
| 2 | თბილისის ზღვა — კაშხალი | Tbilisi Sea, dam side | reservoir | 41.745, 44.855 | carp, catfish | Same restrictions as above. |
| 3 | ლისის ტბა | Lisi Lake | lake | 41.745, 44.735 | crucian, carp | Urban, easy access. |
| 4 | კუს ტბა | Turtle Lake | lake | 41.700, 44.750 | — | Likely no fishing allowed; include only as info. |
| 5 | კუმისის ტბა | Kumisi Lake | lake | 41.580, 44.840 | carp, crucian, catfish | Shallow, warms early. |
| 6 | ჯანდარის ტბა | Jandara Lake | lake | 41.430, 45.150 | carp, catfish, silver carp | Partly on Azerbaijan border. Check access. |
| 7 | ბაზალეთის ტბა | Bazaleti Lake | lake | 42.030, 44.680 | carp, crucian | Popular, cottages around. |
| 8 | სიონის წყალსაცავი | Sioni Reservoir | reservoir | 42.030, 44.970 | carp, chub, catfish | On Iori. |
| 9 | ჟინვალის წყალსაცავი | Zhinvali Reservoir | reservoir | 42.130, 44.780 | trout, chub, barbel | Cold water. Check restrictions. |
| 10 | წალკის წყალსაცავი | Tsalka Reservoir | reservoir | 41.620, 44.050 | trout, carp | High altitude, short season. |
| 11 | ალგეთის წყალსაცავი | Algeti Reservoir | reservoir | 41.500, 44.720 | carp, catfish | Verify coordinates. |
| 12 | მტკვარი — ორთაჭალა | Mtkvari at Ortachala | river | 41.680, 44.830 | catfish, barbel, chub | Urban bank. |
| 13 | მტკვარი — ავჭალა / დიღომი | Mtkvari at Avchala / Digomi | river | 41.790, 44.780 | catfish, barbel | Upstream of city. |
| 14 | არაგვი — ანანურის ქვემოთ | Aragvi below Ananuri | river | 42.160, 44.700 | trout, barbel, khramulya | Clear, cold. |
| 15 | იორი — საგარეჯოს ქვემოთ | Iori below Sagarejo | river | 41.620, 45.350 | chub, barbel, catfish | |
| 16 | ხრამი — მარნეულის ახლოს | Khrami near Marneuli | river | 41.450, 44.800 | barbel, chub, catfish | |
| 17 | ალგეთი — მანგლისი | Algeti at Manglisi | river | 41.700, 44.380 | trout | Small stream. |
| 18 | დალის მთის წყალსაცავი | Dali Mta Reservoir | reservoir | 41.320, 46.170 | carp, catfish, pike-perch | Far, but very popular. |
| 19 | ფარავნის ტბა | Paravani Lake | lake | 41.450, 43.800 | trout, whitefish | High altitude. |
| 20 | ტაბაწყურის ტბა | Tabatskuri Lake | lake | 41.650, 43.630 | trout | High altitude, protected area check. |
| 21+ | ფასიანი ტბები | Paid ponds | paid pond | various | carp | Owner-submitted listings, fee shown. |

---

## 7. Species table (ka names need native review)

| en | ka | Optimum water °C | Main season | Notes |
|---|---|---|---|---|
| Common carp | კობრი | 20–26 | May–Oct | Main target at lakes. |
| Wels catfish | ლოქო | 18–26 | Jun–Sep, nights | Mtkvari, Tbilisi Sea. |
| Crucian carp | კარჩხანა | 18–26 | Apr–Oct | Urban lakes. |
| Brown trout | კალმახი | 8–16 | Apr–Oct | Aragvi, Algeti, Tsalka. Check closed season. |
| Barbel | წვერა | 14–22 | May–Sep | Rivers. |
| Chub | ქაშაპი | 14–22 | Apr–Oct | Rivers. |
| Khramulya | ხრამული | 12–20 | May–Sep | Endemic to region. |
| Pike-perch | ფარგა | 15–22 | Apr–Jun, Sep–Nov | Reservoirs. |
| Pike | ქარიყლაპია | 10–18 | Mar–May, Sep–Nov | Some reservoirs. |
| Perch | ქორჭილა | 12–20 | all year | |
| Silver carp | თეთრი სქელშუბლა | 22–28 | Jun–Sep | Jandara, Dali Mta. |

---

## 8. Localization implementation

- Library: `i18next` + `react-i18next`, locale detected from
  `navigator.language`, stored in `localStorage`, and mirrored in the URL
  (`/ka/...`, `/en/...`) so links open in the right language.
- Files: `locales/ka.json` (source of truth) and `locales/en.json`.
- Keys are semantic (`spot.activity.stablePressure`), never English text
  as key. Georgian is written first; English is translated from it.
- Georgian has no capital letters. Do not apply `textTransform: uppercase`
  anywhere; it does nothing for Georgian and looks wrong for mixed text.
- Font: Noto Sans Georgian for ka, Inter or system for en. Load both and
  set `fontFamily` by locale. Test that numbers and units render in the
  same font weight.
- Georgian plural: one form for all counts. Keep `count` interpolation but
  do not rely on plural suffix keys for ka.
- Dates: `Intl.DateTimeFormat('ka-GE')` gives Georgian month names.
  Times are 24-hour in both languages.
- Units: metric only. °C, km/h, hPa, cm, kg, mm.
- Spot names, species names, regulation text live in the database with
  `name_ka` / `name_en` columns, not in JSON files.
- Run every ka/en pair through LingoLint in CI to catch missing keys,
  placeholder mismatches, and untranslated strings.

Core glossary (ka / en):

| ka | en |
|---|---|
| თევზაობა | fishing |
| ადგილი | spot |
| ტბა | lake |
| მდინარე | river |
| წყალსაცავი | reservoir |
| ფასიანი ტბა | paid pond |
| აქტივობა | activity |
| პროგნოზი | forecast |
| წნევა | pressure |
| ქარი | wind |
| წყლის დონე | water level |
| წყლის ტემპერატურა | water temperature |
| სახეობა | species |
| სატყუარა | bait |
| ნადავლი | catch |
| ანგარიში | report |
| წესები | regulations |
| ქვირითობის პერიოდი | spawning season |
| აკრძალულია | prohibited |
| ოფლაინ რუკა | offline map |

---

## 9. UI design direction: minimal liquid glass

The map is the app. Everything else floats on top of it as glass.

**Layout (mobile-first, works on desktop):**
- Full-viewport MapLibre map, muted light basemap with water emphasized.
- Top: one floating search pill (spot name in ka or en) with the language
  toggle as a tiny "ქა / EN" chip inside it. Nothing else at the top.
- Map: spot markers are round glass bubbles showing the score number, tinted
  by band. Selected bubble grows with a spring animation.
- Bottom: one draggable glass sheet with three snap points: peek (score +
  one-line summary), half (48 h strip + breakdown), full (species,
  regulations, reports, actions).
- Floating action bubble bottom-right: "+" for catch or report.
- No tab bar, no header bar, no hamburger. Settings live under the language
  chip.

**Glass material tokens:**
```
--glass-bg:        rgba(255,255,255,0.55)   /* dark: rgba(20,20,24,0.55) */
--glass-border:    rgba(255,255,255,0.65)   /* dark: rgba(255,255,255,0.10) */
--glass-blur:      blur(24px) saturate(160%)
--glass-radius-lg: 28px    /* sheets, cards */
--glass-radius-md: 20px    /* pills, buttons */
--glass-radius-sm: 14px    /* chips */
--glass-shadow:    0 8px 32px rgba(0,0,0,0.12)
--glass-highlight: inset 0 1px 0 rgba(255,255,255,0.7)
```
- `backdrop-filter` with a solid-color fallback when unsupported.
- One accent color only, for the "great" band and primary action.
  Score bands: grey (no data), soft red, amber, green, accent.
- Text: Inter for en, Noto Sans Georgian for ka. Sizes 13 / 15 / 17 / 22 /
  34, iOS-like. Large numbers use tabular figures.
- Motion: Framer Motion springs (stiffness 300, damping 30). Sheet drag,
  bubble select, and score count-up are the only animations. Respect
  `prefers-reduced-motion`.
- Light and dark themes follow the system. Map style swaps with them.
- Performance rule: at most three blurred layers on screen at once.
  Blur is expensive on low-end Android browsers.

**Screens in MVP:** Map, Spot sheet, Species guide, Catch log, My catches,
Settings. Six screens total. Everything else is a state of the sheet.

---

## 10. Architecture

**Frontend:** Vite + React + TypeScript, MapLibre GL JS, react-i18next,
TanStack Query, Framer Motion, Tailwind CSS with the glass tokens above as
CSS variables, vite-plugin-pwa for the service worker, Dexie for IndexedDB.

**Backend:** Node (Fastify) or Python (FastAPI). Postgres 16 + PostGIS.
Redis optional for hourly score cache. Hosted on a small VPS or Fly.io;
Postgres on Neon or Supabase to start.

**Auth:** magic link by email plus Google sign-in. No passwords. Anonymous
browsing is allowed; login only to log catches or post reports.

**Jobs:**
- `pull_weather` hourly: Open-Meteo for every spot.
- `pull_hydrology` daily: GloFAS discharge + NEA bulletin parse.
- `compute_scores` hourly: 48 h of scores per spot, store in
  `spot_scores(spot_id, ts, score, confidence, breakdown jsonb)`.
- `refresh_osm` monthly: Overpass export of water and access features.

**Core tables:**
```
spots(id, name_ka, name_en, type, geom, depth_class, species_mix jsonb,
      access_ka, access_en, regulation_ids[], is_paid, fee_gel)
weather_hourly(spot_id, ts, temp, pressure, wind_speed, wind_dir,
      cloud, precip, source, fetched_at)
hydrology_daily(spot_id, date, discharge, level_cm, trend, source)
spot_scores(spot_id, ts, score, confidence, breakdown jsonb, model_version)
species(id, name_ka, name_en, opt_temp_min, opt_temp_max, season jsonb,
      min_size_cm, notes_ka, notes_en)
regulations(id, scope, text_ka, text_en, starts_on, ends_on,
      source_url, verified_at)
catches(id, user_id, spot_id, species_id, ts, weight_kg, length_cm,
      bait, method, photo_url, weather_snapshot jsonb, is_public)
reports(id, user_id, spot_id, ts, activity smallint, note, photo_url)
users(id, locale, created_at, ...)
```

**API (v1):**
```
GET  /spots?bbox=            list with current score
GET  /spots/:id              sheet data incl. 48 h scores and breakdown
GET  /spots/:id/reports
POST /spots/:id/reports
POST /catches
GET  /me/catches
GET  /species
GET  /regulations?spot_id=
GET  /offline/region?bbox=   bundle for offline download
```

All text fields returned in both languages; the app picks by locale so
switching language is instant and offline.

---

## 11. Build plan (8 weeks, one developer)

| Week | Deliverable |
|---|---|
| 1 | Repo, Postgres + PostGIS, seed 20 spots, Open-Meteo pull job, score function v0. |
| 2 | Vite app shell, full-screen MapLibre map, glass score bubbles, ka/en toggle, light/dark. |
| 3 | Glass bottom sheet with three snap points: score, breakdown, 48 h strip, bilingual summary. |
| 4 | Hydrology pull (GloFAS + NEA), water trend in model and UI. |
| 5 | Species guide, regulations content (hand-verified), closed-season web push. |
| 6 | Auth, catch log with photo and auto weather snapshot. Community reports and feed. |
| 7 | PWA: install prompt, shell and tile caching, IndexedDB sync queue. Deploy to production domain. |
| 8 | Closed beta with 30–50 anglers from Georgian fishing Facebook groups. Fix, then public launch. |

---

## 11a. Monetization (added 2026-09-15, user asked for ideas)

Principle: reach popularity first. Keep the free tier good enough that a
weekend angler never feels blocked. Charge for depth, convenience, and
business use. Freemium apps convert 2–5% of monthly actives; in Georgia
the price must be low, so B2B lines matter as much as subscriptions.

**Free**
- Map, today's score for every spot, 48 h strip, breakdown, species,
  regulations, catch log (last 50), community reports, one saved spot
  with alerts.

**Pro — suggested 4.99 GEL / month or 39 GEL / year** ("ანკესი პრო")
- 7-day forecast and best windows for the whole week (Open-Meteo already
  serves 16 days; this is the cheapest feature to ship and the most
  obvious upsell).
- Unlimited saved spots and alerts, including "conditions turn good in
  the next 24 h" pushes.
- Trip planner for 7 days with drive times.
- Unlimited catch history, personal stats, CSV export, private photo
  album.
- Offline map regions.
- Hourly pressure trend graph and moon calendar.
- Early access to new regions.

**Business lines (likely the bigger earner early)**
- Paid pond listings: 30–50 GEL / month per pond for a verified listing
  with photos, prices, hours, phone, and a "book" button. There are many
  private carp ponds around Tbilisi and they compete for weekend traffic.
- Tackle shop and guide directory: sponsored placement per region.
- Guide bookings: 10–15% commission on trips booked through the app.
- Brand sponsorship: bait or tackle brand sponsors the "bait of the day"
  hint per species. Clearly labeled as sponsored.
- Tournaments: organizers pay a flat fee for registration and live
  leaderboard tooling.

**Later**
- Family or club plan: 5 accounts for 79 GEL / year.
- Data API for tourism agencies and weather portals.

**Payments reality for Georgia**
- Stripe does not onboard Georgian companies. Options: Paddle or Lemon
  Squeezy as merchant of record (they handle VAT and take ~5%), or a
  local gateway for GEL cards: Payze, TBC Pay / TBC E-Commerce, or Bank of
  Georgia iPay. Paddle for foreign cards plus a local gateway for GEL is the
  usual combination.
- Web app means no App Store 30% cut. If a native wrapper ships later,
  in-app purchase rules apply on iOS.
- Legal entity: Georgian LLC. Virtual Zone status gives 0% profit tax on
  foreign IT revenue; Small Business status (1%) works while revenue is
  under the threshold.

**Sequence**
1. Launch free, collect reports, build trust (months 1–3).
2. Add paid pond listings once ponds ask to be included (month 2+).
3. Launch Pro with the 7-day forecast when weekly actives pass ~2,000.

---

## 12. Validation plan

1. Before writing the app, post in the two or three largest Georgian
   fishing Facebook groups: a screenshot of the map mock plus a two-question
   poll. Target 200 responses. Ask which spots they fish and whether they
   would trust a forecast that shows its reasoning.
2. Recruit 30 beta testers from respondents. Ask each to log every trip for
   one month, even the bad ones. Bad trips are the most valuable data.
3. Success metric for beta: 40% of testers open the app the morning of a
   trip, and at least 300 reports collected.
4. Launch metric for month 1: 2,000 installs, 500 weekly actives, 1,000
   reports. Georgian fishing community is large enough for this by word of
   mouth alone.

---

## 13. Open questions to resolve before week 5

- Exact current closed-season dates and size limits per species (Ministry).
- Whether shore fishing is permitted at Tbilisi Sea and in which zones.
- Which NEA gauges publish daily and in what format.
- Whether OpenFreeMap tiles are acceptable for offline caching under their
  terms, or whether MapTiler is needed.
- Legal entity: Georgian LLC with Virtual Zone status if selling abroad
  later, otherwise Small Business status is enough at MVP.
