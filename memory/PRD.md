# Namma Bengaluru – PRD

## Identity
- **Product**: Namma Bengaluru (renamed from ParkWise AI)
- **Tagline**: "Bengaluru City Traffic Police · Intelligence Console"
- **Source repo**: https://github.com/TanmaySawankar390/ParkWise-AI

## Problem Statement
A traffic-congestion control + parking-violation intelligence layer over Bengaluru
City Traffic Police data. The Traffic Police don't lack effort — they lack
**where**, **when**, and **which-zone-first**. This console surfaces exactly that.

## Architecture
- **Backend**: FastAPI (`/app/backend/main.py`), entry point `/app/backend/server.py`
- **Persistence**: JSON files in `/app/backend/data/` (auto-seeded by `seed_data.py` — 40 realistic Bengaluru zones across 3 personas: Critical, Frequent Violation, Hidden Risk + standard zones)
- **AI**: `gemini_engine.py` — Gemini 2.5 Flash via Google Generative AI API with deterministic fallback
- **Frontend**: React (CRA + craco) + react-leaflet + recharts + framer-motion + lucide-react
- **Routing**: All backend APIs `/api/*`; frontend uses `process.env.REACT_APP_BACKEND_URL`

## Core API Surface (`/api/...`)
- `GET /hotspots` – includes `hourly_distribution` (needed by dashboard)
- `GET /hotspot/{zone_id}` – full case-file detail
- `GET /density-map`, `GET /impact-map` – marker payloads
- `GET /analytics` – KPIs, top-10 lists, severity buckets, police-station roll-up
- `GET /recommendations` – grouped by classification + priority + `all` list
- `GET /recommendation/{zone_id}` – single zone dispatch card
- `POST /recommendation/{zone_id}/explain` – Gemini 2.5 Flash briefing (cached)

## Design Language
- **Palette**: Cubbon Green (#1B4332) primary · Signal Red (#D90429) alerts · Auto-Rickshaw Yellow (#E9C46A) accent · warm Sand (#F8F6F0) canvas
- **Typography**: Outfit (display) + IBM Plex Sans (body) + IBM Plex Mono (overlines/timestamps) + Noto Sans Kannada/Tamil/Telugu/Devanagari/Arabic/Malayalam (multilingual hero)
- **Motion**: Framer-Motion cross-fade for the animated "Bengaluru" hero, signal-light pulses on map markers, staggered fade-up on grids
- **Trust signals**: Diagonal hazard stripes on Critical cards, OFFICIAL DISPATCH overlines, ನ Kannada seal in brand mark

## Pages Implemented
- **Landing Page** (`LandingPage.jsx`): Animated multilingual `Bengaluru` hero (7 scripts on a 2.2s loop), live KPI ticker (Risk Zones, Violations, Critical, Hidden Risk), emotional Bengaluru-traffic story with photo, 5-step operational journey (Detect → Analyse → Decide → Deploy → Reflect with Kannada labels), dark "What officers see" features section, footer
- **Top Nav** (`TopNav.jsx`): Sticky bar with brand lockup (animated multilingual title), 4 pill nav, live-feed chip
- **Live City Map** (`MapView.jsx`): CartoDB light tiles, 40 markers, Density ↔ Impact toggle, search filter, pulsing markers, light-themed legend + popup → Field Briefing
- **City Pulse** (`CityDashboard.jsx`): 4 odometer KPIs, two Top-10 danger-scale lists (with hazard stripe on Priority Watchlist), Waffle Chart for severity (100 squares = 100% of risk footprint), Traffic Wave area chart + Peak Hour callout, Police Station horizontal bar chart
- **Action Center** (`RecommendationPanel.jsx`): 5 classification KPI cards, filter pills, per-zone case cards with metric strip + dispatch action checklist + inline Gemini AI briefing
- **Field Briefing** (`ZoneDetails.jsx`): Right-side slide-over case file — OFFICIAL DISPATCH header with hazard stripe, classification badge, metric grid, on-demand AI briefing, recommended actions, 24-hour rhythm bars (red peaks), vehicle pills with emoji icons, hottest streets, jurisdiction
- **About** (`App.js`): Mission, Map 1 vs Map 2, Gemini's role, tech stack

## What's Been Implemented
- [x] Renamed product to Namma Bengaluru, animated multilingual hero
- [x] Landing page with emotional Bengaluru-cultural narrative
- [x] 5-beat operational journey rail (with Kannada labels)
- [x] Re-visualised KPIs (odometers, danger scales, waffle, traffic wave)
- [x] Field Briefing case-file design for ZoneDetails
- [x] Diversified seed data so all 5 classifications appear (Critical=6, Frequent=1, Hidden Risk=3, Moderate=15, Stable=15)
- [x] Fixed `/api/hotspots` to include `hourly_distribution`
- [x] Fixed map popup to conditionally render Impact / Violations per mode
- [x] Fixed duplicate-key warning in danger-list rows
- [x] Verified zero console errors across all pages
- [x] Testing subagent: all 14 frontend flows pass (iteration_2)

## Backlog / Future Enhancements
- P1: CSV upload → `POST /api/process` to replace seed data with real Bengaluru dataset
- P1: Persist hotspots + recommendations + cached AI briefings to MongoDB for multi-replica
- P2: "Compare Two Zones" view with Gemini comparative narrative
- P2: Time-of-day deployment recommendation that ties Traffic Wave peaks to Action Center cards
- P2: Officer-attribution log per dispatch action
- P2: Recharts ResponsiveContainer parents — explicit min-height to silence initial-mount warnings

## Next Action Items
1. Upload the live Bengaluru CSV via `POST /api/process`
2. Decide MongoDB migration scope (multi-replica? multi-user?)
3. Add "Compare Zones" view if desired
