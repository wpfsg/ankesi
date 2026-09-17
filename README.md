# ანკესი · Ankesi

Fishing conditions for Georgia. A full-screen map of lakes, reservoirs,
rivers and the Black Sea coast, with a live activity score for every spot
built from real weather, sea and astronomy data, and corrected by anglers'
own reports. Georgian first, English second.

Every number in the app is either measured or clearly labeled as an estimate,
and the score always shows what it is made of.

## Layout

| Path | What |
|---|---|
| [`web/`](web/) | The web app (Vite, React, TypeScript, MapLibre). See its README to run it. |
| [`supabase/`](supabase/) | The backend: schema with row-level security, seed, auth and storage config, edge function, RLS test suite, setup guide. |
| [`docs/MVP_SPEC.md`](docs/MVP_SPEC.md) | Product spec: features, data sources, scoring model, seed spots, localization, build plan, monetization. |

## Quick start

```sh
cd web
npm install
npm run dev      # http://localhost:5173/ka
```

The app works read-only without a backend. Accounts, profiles, the catch
log, community reports, saved spots and paid-pond listings switch on once a
Supabase project is connected: [`supabase/SETUP.md`](supabase/SETUP.md),
about 20 minutes, all from the command line.

## Data sources

Open-Meteo (weather and marine), SunCalc (sun and moon), OpenFreeMap and
OpenStreetMap (map and water bodies). Water temperature for inland spots and
river level are estimates until gauges are connected, and are labeled so.

## Status

Milestone 1 (map, live scores, trip planner, bilingual UI) is done.
Milestone 2 (accounts with a profile page, catch log, community reports,
saved spots, paid ponds, Premium launch list) is live on a Supabase project;
its schema is verified by `supabase/tests`. Milestone 3
(PWA, alerts, payments) is next.
Regulations and closed seasons are not yet verified with the Ministry of
Environmental Protection and Agriculture; the app says so on every spot.
