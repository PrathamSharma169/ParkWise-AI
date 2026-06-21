# 🚦 Cracking the Gridlock: Namma AI-Powered Parking Intelligence for Bengaluru

> **ParkWise AI** — A real-time parking violation intelligence and dispatch command platform for Bengaluru's traffic enforcement teams. Built with a FastAPI backend, React frontend, Supabase (PostgreSQL) database, and Namma AI (Google Gemini) for intelligent briefings and zone-level risk analysis.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| **Frontend** | [https://parkwise-ai.vercel.app](https://parkwise-ai.vercel.app) *(or your deployed URL)* |
| **Backend API** | [https://parkwise-api.onrender.com](https://parkwise-api.onrender.com) *(or your deployed URL)* |
| **API Docs** | `<backend-url>/docs` |

> **Note for reviewers:** The backend runs on Render's free tier — it may take **15–20 seconds to wake up** on the first request. The frontend will display data once the backend responds.

---

## ✨ Features at a Glance

- 🗺️ **Live Violation Map** — Density & Impact mode with wavy pulse animations on top hotspots
- 📊 **City Dashboard** — KPIs, severity waffle chart, hourly traffic wave, police jurisdiction load
- 🎯 **Zone Recommendations** — Ranked dispatch actions per zone with Namma AI briefings
- 📈 **Trends Comparison** — Side-by-side zone analytics with AI-generated suggestions
- 🔍 **Date Filtering** — Slice all views by any date range in the dataset (Nov 2023 – Apr 2024)
- 🤖 **Namma AI** — One-click AI field briefings explaining risk factors and expected outcomes

---

## 🗂️ Project Structure

```
ParkWise-AI/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # API routes & app entry point
│   ├── data_processor.py     # Cluster analytics & impact scoring
│   ├── violation_store.py    # Supabase query layer & in-memory cache
│   ├── gemini_engine.py      # Namma AI (Google Gemini) integration
│   ├── models.py             # SQLAlchemy ORM models
│   ├── database.py           # DB connection & init
│   ├── import_violations.py  # One-time CSV → Supabase import script
│   ├── cluster_labels.json   # Pre-computed DBSCAN cluster assignments
│   ├── requirements.txt
│   ├── .env.example          # Environment variable template
│   └── data/
│       ├── hotspots.json          # Pre-computed zone analytics
│       └── recommendations.json   # Pre-computed dispatch recommendations
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # MapView, CityDashboard, TrendsDashboard, etc.
│   │   ├── pages/            # AboutPage
│   │   ├── layouts/          # ConsoleLayout (date filter + nav)
│   │   └── utils/            # API client, temporal scope hook
│   ├── public/
│   └── package.json
│
├── sample.csv                # Raw parking violation dataset (293K rows)
├── render.yaml               # Render deployment blueprint
└── README.md
```

---

## ⚙️ Prerequisites

| Tool | Minimum Version |
|---|---|
| Python | 3.12+ |
| Node.js | 18+ |
| npm / yarn | Latest |
| A Supabase project | Free tier works |
| Google Gemini API key | Free tier works |

---

## 🚀 Running Locally — Step by Step

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd ParkWise-AI
```

---

### Step 2 — Set Up the Backend

#### 2a. Create and activate a virtual environment

```bash
cd backend

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

#### 2b. Install dependencies

```bash
pip install -r requirements.txt
```

#### 2c. Configure environment variables

```bash
# Copy the example file
cp .env.example .env
```

Now open `backend/.env` and fill in:

```env
# Supabase Postgres connection string
# Get from: Supabase Dashboard → Project Settings → Database → Connection string → URI
# Use Session pooler (port 6543) for production, direct (port 5432) for local import
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Google Gemini API key (for Namma AI briefings)
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Load all violation rows into RAM for fast local filtering (recommended for local dev)
PRELOAD_VIOLATIONS=true
```

#### 2d. Import violation data into Supabase *(one-time setup)*

> **Skip this step if the reviewers' Supabase DB is already populated.**

Make sure `sample.csv` is in the project root, then run:

```bash
# From the backend/ directory
python import_violations.py
```

This will:
1. Create the `violations` table in your Supabase database
2. Import all 293,000+ parking violation rows
3. Takes ~5–10 minutes depending on your connection speed

> To re-import and replace existing data: `python import_violations.py --clear`

#### 2e. Start the backend server

```bash
python main.py
```

The API will start at **`http://localhost:8000`**

You should see output like:
```
Loaded 50 hotspots from JSON
Loaded 50 recommendations from JSON
INFO:     Application startup complete.
Violation store ready: 293,XXX rows (2023-11-01 -> 2024-04-08)
Loading violations into memory from database (one-time)...
Violation memory cache ready: 293,XXX rows
```

> ✅ Verify the API is running: open [http://localhost:8000](http://localhost:8000) — you should see a JSON health check response.

---

### Step 3 — Set Up the Frontend

Open a **new terminal** and navigate to the frontend:

```bash
cd frontend
```

#### 3a. Install dependencies

```bash
npm install
# or
yarn install
```

#### 3b. Configure environment variables

Create `frontend/.env`:

```env
# Point to your local backend
REACT_APP_BACKEND_URL=http://localhost:8000
```

> For the deployed version, set this to your Render backend URL.

#### 3c. Start the development server

```bash
npm start
# or
yarn start
```

The app will open at **`http://localhost:3000`**

---

## 🧭 How to Use the App

Once both servers are running, navigate to **`http://localhost:3000`**:

| Page | How to reach it | What to test |
|---|---|---|
| **Landing** | `/` | Click "Enter Console" |
| **Map View** | `/console/map` | Switch between Density / Impact mode; click a zone marker to open the briefing panel |
| **City Dashboard** | `/console/dashboard` | View KPIs, severity mix, hourly wave, police jurisdiction chart |
| **Recommendations** | `/console/recommendations` | Filter by Critical / High / Moderate; click "Generate AI Briefing" on any zone card |
| **Trends** | `/console/trends` | Select two zones and an hour range; click "Generate AI Suggestions" |
| **About** | `/console/about` | Meet the team |
| **Date Filter** | Top nav bar (any page except Trends) | Pick a date range to re-filter all data dynamically |

---

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/hotspots` | All zone hotspots (supports `?start_date=&end_date=`) |
| `GET` | `/api/density-map` | Violation density map data |
| `GET` | `/api/impact-map` | Operational impact map data |
| `GET` | `/api/analytics` | City-wide KPI summary |
| `GET` | `/api/recommendations` | Ranked dispatch recommendations |
| `GET` | `/api/hotspot/{zone_id}` | Detailed zone info |
| `POST` | `/api/recommendation/{zone_id}/explain` | Namma AI risk briefing |
| `GET` | `/api/trends/compare` | Zone-vs-zone trend comparison |
| `POST` | `/api/trends/explain` | Namma AI trend suggestions |
| `GET` | `/api/date-range` | Dataset min/max date bounds |

> Full interactive docs: **`http://localhost:8000/docs`**

---

## 🧪 Running Tests

```bash
# From the backend/ directory
cd backend
pytest tests/ -v
```

---

## 🚢 Deployment

The project is configured for **Render** (backend) + **Vercel** (frontend).

### Backend on Render

A `render.yaml` blueprint is included. To deploy:

1. Push your repo to GitHub
2. In Render Dashboard → New → Blueprint → connect your repo
3. Set the secret environment variables:
   - `DATABASE_URL` — your Supabase connection string
   - `GEMINI_API_KEY` — your Google Gemini key
4. Render will auto-deploy from `render.yaml`

> Set `PRELOAD_VIOLATIONS=false` on Render free tier (512 MB RAM limit) to avoid OOM. Trends will query Supabase per request instead.

### Frontend on Vercel

1. Push your repo to GitHub
2. Import the project in Vercel Dashboard
3. Set root directory to `frontend`
4. Add environment variable: `REACT_APP_BACKEND_URL=<your-render-backend-url>`
5. Deploy

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router, Recharts, Leaflet, Framer Motion |
| **Backend** | FastAPI, SQLAlchemy, Pandas, Uvicorn |
| **Database** | Supabase (PostgreSQL) |
| **AI / ML** | Google Gemini (`gemini-2.0-flash`), DBSCAN clustering |
| **Deployment** | Render (backend), Vercel (frontend) |
| **Styling** | Vanilla CSS, custom design system |

---

## 👨‍💻 Team

| Developer | Role | Links |
|---|---|---|
| **Pratham Sharma** | Frontend Architect & Systems Engineer | [GitHub](https://github.com/PrathamSharma169) · [LinkedIn](https://www.linkedin.com/in/pratham-sharma-9a5307251/) |
| **Tanmay Sawankar** | Backend Architect & Data Scientist | [GitHub](https://github.com/TanmaySawankar390) · [LinkedIn](https://www.linkedin.com/in/tanmay-sawankar-57a945223) |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
