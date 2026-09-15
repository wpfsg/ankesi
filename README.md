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
| [`supabase/`](supabase/) | Database schema, seed, edge function, and setup guide for accounts, catches, reports and paid ponds. |
| [`docs/MVP_SPEC.md`](docs/MVP_SPEC.md) | Product spec: features, data sources, scoring model, seed spots, localization, build plan, monetization. |

## Quick start

```sh
cd web
npm install
npm run dev      # http://localhost:5173/ka
```

The app works without a backend. To enable accounts and community features,
follow [`supabase/SETUP.md`](supabase/SETUP.md).

## Data sources

Open-Meteo (weather and marine), SunCalc (sun and moon), OpenFreeMap and
OpenStreetMap (map and water bodies). Water temperature for inland spots and
river level are estimates until gauges are connected, and are labeled so.

## Status

Milestone 1 (map, live scores, trip planner, bilingual UI) is done.
Milestone 2 (Supabase accounts, catch log, community reports, paid ponds)
is coded and awaits a live project. Milestone 3 (PWA, alerts) is next.
Regulations and closed seasons are not yet verified with the Ministry of
Environmental Protection and Agriculture; the app says so on every spot.
