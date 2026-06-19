# ParkWise AI – PRD

## Problem Statement
User imported their GitHub repo (https://github.com/TanmaySawankar390/ParkWise-AI) and asked to connect it into this workspace and continue work. ParkWise AI is a **Parking Enforcement Intelligence Platform** for Bengaluru that:
- Detects parking hotspots from violation data
- Ranks zones by a custom Impact Score (45% density + 25% vehicle weight + 15% junction proximity + 15% enforcement difficulty)
- Classifies zones (Critical / Frequent Violation / Hidden Risk / Moderate / Stable)
- Generates rule-engine recommendations
- Uses **Gemini 2.5 Flash** (via Emergent Universal LLM Key) to explain each zone on demand

## Architecture
- **Backend**: FastAPI (`/app/backend/main.py`), entry point `/app/backend/server.py`
- **Persistence**: JSON files at `/app/backend/data/hotspots.json` + `recommendations.json` (auto-seeded by `seed_data.py` on first start; 40 realistic Bengaluru zones)
- **AI**: `gemini_engine.py` → `emergentintegrations.LlmChat` + `gemini-2.5-flash` with deterministic fallback
- **Frontend**: React (CRA + craco) + react-leaflet 4.2.1 + recharts + lucide-react
- **Routing**: All backend APIs under `/api`; frontend uses `process.env.REACT_APP_BACKEND_URL`

## Core API Surface (all `/api/...`)
- `GET /hotspots` – list view
- `GET /hotspot/{zone_id}` – detail (vehicle dist, hourly dist, top locations, recommendations)
- `GET /density-map` / `GET /impact-map` – marker payloads with colours
- `GET /analytics` – KPIs + Top-10 lists + severity distribution + police-station roll-up
- `GET /recommendations` – grouped by classification + by priority
- `GET /recommendation/{zone_id}` – single zone classification + actions
- `POST /recommendation/{zone_id}/explain` – Gemini 2.5 Flash explanation (cached per zone in-memory)

## What's Been Implemented (Jan 2026)
- [x] Cloned repo, ported into Emergent-compatible layout (server.py + CRA frontend)
- [x] Seeded realistic dataset for 40 Bengaluru zones through the same impact-score / classification pipeline
- [x] Wired Gemini 2.5 Flash via Emergent Universal LLM Key (`emergentintegrations.LlmChat`)
- [x] Replaced direct `/api` fetch with `REACT_APP_BACKEND_URL` everywhere
- [x] Added Leaflet CSS to `public/index.html`, disabled React StrictMode to avoid Leaflet "Map container is already initialized" error
- [x] Dark-themed Maps page with Density / Impact toggle + ZoneDetails right panel
- [x] City Intelligence Dashboard with KPIs, Top-10 lists, severity pie, vehicle bar, police-station bar
- [x] Recommendation Center with 5 classification KPI cards, filters, AI-explain on each card
- [x] Verified end-to-end by testing subagent (100% backend, 100% frontend)

## Backlog / Future Enhancements (P1/P2)
- P1: Plug a real CSV upload + `data_processor.run_pipeline()` UI so the user can replace seed data with the live Bengaluru dataset
- P1: Persist hotspots/recommendations to MongoDB so they survive restarts and scale beyond a single replica
- P2: Fix Recharts initial-mount warnings by giving ResponsiveContainer parents explicit min-height/min-width
- P2: Standardise `data-testid` across Sidebar / Map toggle / ZoneDetails (currently use `id="nav-*"`)
- P2: Make `/api/recommendation/{id}/explain` truly async by awaiting LlmChat from FastAPI's event loop (currently runs in a worker thread)
- P2: Adjust classification thresholds so the 'Frequent Violation' and 'Hidden Risk' buckets are populated with the current seed distribution

## Next Action Items
1. Decide on a real dataset path (CSV upload UI vs. paste-in-bucket)
2. Migrate persistence to MongoDB if multi-user / multi-replica is in scope
3. Tighten CORS and split routers in `main.py` once more endpoints are added
