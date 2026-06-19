"""
ParkWise AI - Server Entry Point

Wraps the FastAPI app from `main.py` so it can run under the
Emergent platform supervisor (uvicorn server:app --port 8001).

On first startup, if `data/hotspots.json` is missing, a seed dataset
is generated automatically so the dashboard renders out-of-the-box.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Make sure seed data exists BEFORE main.py loads it on startup
from seed_data import ensure_seed_data  # noqa: E402

ensure_seed_data()

# Import the FastAPI app from main.py — it already exposes all /api/* routes
from main import app  # noqa: E402,F401
