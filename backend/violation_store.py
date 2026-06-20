"""
Load and persist raw violation rows from the database (Supabase/Postgres).
Replaces in-memory CSV loading for date filtering and trends.
"""

from __future__ import annotations

import threading
from datetime import datetime
from typing import Optional

import pandas as pd
from sqlalchemy import func, insert, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from database import DATABASE_URL, SessionLocal, engine, init_db
from models import Violation

DATAFRAME_COLUMNS = [
    "id",
    "latitude",
    "longitude",
    "location",
    "vehicle_type_clean",
    "violation_type",
    "police_station",
    "junction_name",
    "created_datetime",
    "closed_datetime",
    "hour",
    "day_of_week",
    "month",
    "resolution_hours",
    "is_junction",
    "cluster_id",
]

_store_lock = threading.Lock()
_db_ready = False
_date_bounds: Optional[tuple[datetime, datetime]] = None

# In-memory snapshot — loaded once from DB, filtered locally (fast date queries)
_violations_df: Optional[pd.DataFrame] = None
_violations_df_lock = threading.Lock()

BATCH_SIZE = 2000

VIOLATIONS_SELECT_SQL = """
SELECT id, latitude, longitude, location, vehicle_type_clean, violation_type,
       police_station, junction_name, created_datetime, closed_datetime,
       hour, day_of_week, month, resolution_hours, is_junction, cluster_id
FROM violations
"""


def _parse_bound(value, end_of_day: bool = False) -> Optional[datetime]:
    if value is None:
        return None
    ts = pd.to_datetime(value, utc=True)
    if end_of_day:
        ts = ts + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
    if isinstance(ts, pd.Timestamp):
        return ts.to_pydatetime()
    return ts


def violation_count(db: Optional[Session] = None) -> int:
    owns_session = db is None
    if owns_session:
        db = SessionLocal()
    try:
        return db.query(func.count(Violation.id)).scalar() or 0
    except ProgrammingError:
        if owns_session:
            db.rollback()
        return 0
    finally:
        if owns_session:
            db.close()


def get_date_bounds(db: Optional[Session] = None) -> tuple[Optional[datetime], Optional[datetime]]:
    owns_session = db is None
    if owns_session:
        db = SessionLocal()
    try:
        min_dt = db.query(func.min(Violation.created_datetime)).scalar()
        max_dt = db.query(func.max(Violation.created_datetime)).scalar()
        return min_dt, max_dt
    finally:
        if owns_session:
            db.close()


def init_violation_store(force: bool = False) -> bool:
    """Verify violations exist and cache date bounds. Returns True when ready."""
    global _db_ready, _date_bounds

    with _store_lock:
        if _db_ready and not force:
            return True

        init_db()
        count = violation_count()
        if count == 0:
            _db_ready = False
            _date_bounds = None
            print("Violation store: no rows in database. Run import_violations.py first.")
            return False

        min_dt, max_dt = get_date_bounds()
        _date_bounds = (min_dt, max_dt)
        _db_ready = True
        print(f"Violation store ready: {count:,} rows ({min_dt} -> {max_dt})")
        return True


def is_violation_store_ready() -> bool:
    return _db_ready


def cached_date_bounds() -> tuple[Optional[datetime], Optional[datetime]]:
    return _date_bounds or (None, None)


def _truncate_violations_table(db: Optional[Session] = None) -> None:
    """Remove all violation rows (works reliably with Supabase)."""
    if DATABASE_URL.startswith("sqlite"):
        owns_session = db is None
        if owns_session:
            db = SessionLocal()
        try:
            db.query(Violation).delete()
            db.commit()
        finally:
            if owns_session:
                db.close()
        return

    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("TRUNCATE TABLE violations"))

    remaining = violation_count()
    if remaining:
        owns_session = db is None
        if owns_session:
            db = SessionLocal()
        try:
            db.query(Violation).delete()
            db.commit()
        finally:
            if owns_session:
                db.close()


def clear_violation_store(db: Optional[Session] = None) -> None:
    global _db_ready, _date_bounds

    _truncate_violations_table(db)

    with _store_lock:
        _db_ready = False
        _date_bounds = None


def _prepare_violations_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Drop invalid rows and duplicate primary keys before import."""
    prepared = df.dropna(subset=["created_datetime"]).copy()

    skipped = len(df) - len(prepared)
    if skipped:
        print(f"  Skipping {skipped} rows with invalid created_datetime")

    if "id" in prepared.columns:
        prepared["id"] = prepared["id"].astype(str).str.strip()
        before = len(prepared)
        prepared = prepared.drop_duplicates(subset=["id"], keep="first")
        dupes = before - len(prepared)
        if dupes:
            print(f"  Removed {dupes} rows with duplicate ids")

    return prepared.reset_index(drop=True)


def _safe_int(value, default: int = 0) -> int:
    if pd.isna(value):
        return default
    return int(value)


def _row_to_mapping(row: pd.Series) -> dict:
    created = row["created_datetime"]
    if pd.isna(created):
        raise ValueError(f"Row {row.name} has invalid created_datetime")

    closed = row["closed_datetime"]
    if pd.isna(closed):
        closed = None

    violation_id = row.get("id")
    if pd.isna(violation_id) or violation_id is None:
        violation_id = f"ROW_{row.name}"
    violation_id = str(violation_id).strip()

    resolution = row.get("resolution_hours")
    if pd.isna(resolution):
        resolution = None

    return {
        "id": violation_id,
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "location": str(row.get("location") or ""),
        "vehicle_type_clean": str(row["vehicle_type_clean"]),
        "violation_type": None if pd.isna(row.get("violation_type")) else str(row["violation_type"]),
        "police_station": str(row.get("police_station") or "Unknown"),
        "junction_name": str(row.get("junction_name") or "No Junction"),
        "created_datetime": created.to_pydatetime() if hasattr(created, "to_pydatetime") else created,
        "closed_datetime": closed.to_pydatetime() if closed is not None and hasattr(closed, "to_pydatetime") else closed,
        "hour": _safe_int(row["hour"]),
        "day_of_week": _safe_int(row["day_of_week"]),
        "month": _safe_int(row["month"]),
        "resolution_hours": float(resolution) if resolution is not None else None,
        "is_junction": _safe_int(row["is_junction"]),
        "cluster_id": _safe_int(row["cluster_id"], default=-1),
    }


def _dedupe_batch(batch: list[dict]) -> list[dict]:
    """Ensure a single row per id within an insert batch."""
    by_id: dict[str, dict] = {}
    for mapping in batch:
        by_id[mapping["id"]] = mapping
    return list(by_id.values())


def _insert_batch(db, batch: list[dict]) -> int:
    unique = _dedupe_batch(batch)
    if not unique:
        return 0

    if DATABASE_URL.startswith("sqlite"):
        db.execute(insert(Violation), unique)
        return len(unique)

    from sqlalchemy.dialects.postgresql import insert as pg_insert

    stmt = pg_insert(Violation.__table__).values(unique)
    stmt = stmt.on_conflict_do_nothing(index_elements=["id"])
    db.execute(stmt)
    return len(unique)


def save_violations_from_dataframe(df: pd.DataFrame, clear_existing: bool = True) -> int:
    """Bulk insert cleaned violation rows. Returns number of rows inserted."""
    init_db()
    df = _prepare_violations_dataframe(df)
    print(f"  Prepared {len(df):,} rows for import")
    db = SessionLocal()
    inserted = 0

    try:
        if clear_existing:
            invalidate_violation_store_cache()
            print("  Clearing existing violation rows...")
            _truncate_violations_table(db)
            remaining = violation_count()
            print(f"  Rows in database after clear: {remaining:,}")

        batch: list[dict] = []
        seen_ids: set[str] = set()
        for _, row in df.iterrows():
            mapping = _row_to_mapping(row)
            row_id = mapping["id"]
            if row_id in seen_ids:
                continue
            seen_ids.add(row_id)
            batch.append(mapping)
            if len(batch) >= BATCH_SIZE:
                _insert_batch(db, batch)
                db.commit()
                inserted += len(batch)
                batch = []
                print(f"  Inserted {inserted:,} rows...", flush=True)

        if batch:
            _insert_batch(db, batch)
            db.commit()
            inserted += len(batch)

        init_violation_store(force=True)
        return inserted
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def load_violations_dataframe(
    start_date=None,
    end_date=None,
    cluster_ids: Optional[list[int]] = None,
    min_hour: Optional[int] = None,
    max_hour: Optional[int] = None,
) -> pd.DataFrame:
    """
    Return violation rows for analytics/trends.
    Uses the in-memory snapshot when available; falls back to a filtered SQL query.
    """
    if not init_violation_store():
        return pd.DataFrame(columns=DATAFRAME_COLUMNS)

    with _violations_df_lock:
        cached_df = _violations_df

    if cached_df is not None:
        return _filter_violations_dataframe(
            cached_df,
            start_date=start_date,
            end_date=end_date,
            cluster_ids=cluster_ids,
            min_hour=min_hour,
            max_hour=max_hour,
        )

    db = SessionLocal()
    try:
        query = db.query(Violation)

        start = _parse_bound(start_date, end_of_day=False)
        end = _parse_bound(end_date, end_of_day=True)

        if start is not None:
            query = query.filter(Violation.created_datetime >= start)
        if end is not None:
            query = query.filter(Violation.created_datetime <= end)
        if cluster_ids:
            query = query.filter(Violation.cluster_id.in_(cluster_ids))
        if min_hour is not None:
            query = query.filter(Violation.hour >= min_hour)
        if max_hour is not None:
            query = query.filter(Violation.hour <= max_hour)

        rows = query.all()
        if not rows:
            return pd.DataFrame(columns=DATAFRAME_COLUMNS)

        records = [
            {
                "id": row.id,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "location": row.location or "",
                "vehicle_type_clean": row.vehicle_type_clean,
                "violation_type": row.violation_type,
                "police_station": row.police_station,
                "junction_name": row.junction_name,
                "created_datetime": row.created_datetime,
                "closed_datetime": row.closed_datetime,
                "hour": row.hour,
                "day_of_week": row.day_of_week,
                "month": row.month,
                "resolution_hours": row.resolution_hours,
                "is_junction": row.is_junction,
                "cluster_id": row.cluster_id,
            }
            for row in rows
        ]

        df = pd.DataFrame.from_records(records)
        df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
        df["closed_datetime"] = pd.to_datetime(df["closed_datetime"], errors="coerce", utc=True)
        return df
    finally:
        db.close()


def invalidate_violation_store_cache() -> None:
    global _db_ready, _date_bounds, _violations_df
    with _store_lock:
        _db_ready = False
        _date_bounds = None
    with _violations_df_lock:
        _violations_df = None


def is_violations_df_loaded() -> bool:
    return _violations_df is not None


def load_violations_df_to_memory(force: bool = False) -> bool:
    """
    Load all violation rows into memory once via bulk SQL.
    Subsequent date/hour filters run locally without round-trips to Supabase.
    """
    global _violations_df

    if not init_violation_store(force=force):
        return False

    with _violations_df_lock:
        if _violations_df is not None and not force:
            return True

        print("Loading violations into memory from database (one-time)...")
        df = pd.read_sql(text(VIOLATIONS_SELECT_SQL), engine)
        if df.empty:
            _violations_df = pd.DataFrame(columns=DATAFRAME_COLUMNS)
            print("Violation memory cache: no rows loaded")
            return False

        df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
        df["closed_datetime"] = pd.to_datetime(df["closed_datetime"], errors="coerce", utc=True)
        _violations_df = df
        print(f"Violation memory cache ready: {len(_violations_df):,} rows")
        return True


def _filter_violations_dataframe(
    df: pd.DataFrame,
    start_date=None,
    end_date=None,
    cluster_ids: Optional[list[int]] = None,
    min_hour: Optional[int] = None,
    max_hour: Optional[int] = None,
) -> pd.DataFrame:
    if df.empty:
        return df.copy()

    mask = pd.Series(True, index=df.index)
    start = _parse_bound(start_date, end_of_day=False)
    end = _parse_bound(end_date, end_of_day=True)

    if start is not None:
        mask &= df["created_datetime"] >= start
    if end is not None:
        mask &= df["created_datetime"] <= end
    if cluster_ids:
        mask &= df["cluster_id"].isin(cluster_ids)
    if min_hour is not None:
        mask &= df["hour"] >= min_hour
    if max_hour is not None:
        mask &= df["hour"] <= max_hour

    return df.loc[mask].copy()
