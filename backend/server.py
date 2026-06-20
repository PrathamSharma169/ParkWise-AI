"""
ParkWise AI - Server Entry Point

Wraps the FastAPI app from `main.py` for uvicorn
(e.g. `uvicorn server:app --port 8001`).
"""

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from main import app  # noqa: E402,F401
