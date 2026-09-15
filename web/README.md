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
  data/spots.ts       ~40 spots across Georgia, ka/en names, species mix (coords approximate)
  data/species.ts     species with ka/en names, temperature ranges, seasons
  lib/weather.ts      one Open-Meteo call for all spots
  lib/marine.ts       one Marine API call for sea spots
  lib/scoring.ts      factors, weights, bands, best window
  lib/format.ts       Tbilisi-time formatting, distance, drive-time estimate
  i18n/ka.ts          source language
  i18n/en.ts          translation, typed against ka
  components/         MapView, SearchPill, SpotSheet, ScoreStrip, FactorList, TripPlanner
```

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
