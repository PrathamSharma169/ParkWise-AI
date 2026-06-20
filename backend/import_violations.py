"""
One-time import: load sample.csv + cluster_labels.json into Supabase/Postgres.

Usage (from backend/):
  python import_violations.py
  python import_violations.py --csv ../sample.csv --cluster-json cluster_labels.json
  python import_violations.py --clear
"""

import argparse
import os
import sys

from dotenv import load_dotenv

load_dotenv()

from data_processor import load_and_clean_data, load_cluster_labels
from database import init_db
from violation_store import save_violations_from_dataframe, violation_count


def main() -> int:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(backend_dir)

    parser = argparse.ArgumentParser(description="Import parking violations CSV into the database")
    parser.add_argument(
        "--csv",
        default=os.path.join(repo_root, "sample.csv"),
        help="Path to sample.csv",
    )
    parser.add_argument(
        "--cluster-json",
        default=os.path.join(backend_dir, "cluster_labels.json"),
        help="Path to cluster_labels.json",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Replace existing violation rows",
    )
    parser.add_argument(
        "--skip-if-populated",
        action="store_true",
        help="Exit without importing when violations already exist",
    )
    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"CSV not found: {args.csv}")
        return 1

    if not os.path.exists(args.cluster_json):
        print(f"Cluster labels not found: {args.cluster_json}")
        return 1

    print("Creating database tables if needed...")
    init_db()

    existing = violation_count()
    if existing > 0 and args.skip_if_populated:
        print(f"Database already has {existing:,} violations. Skipping import.")
        return 0

    if existing > 0 and not args.clear:
        print(
            f"Database already has {existing:,} violations. "
            "Re-run with --clear to replace them."
        )
        return 1

    print("Loading and cleaning CSV...")
    df = load_and_clean_data(args.csv)
    df = load_cluster_labels(df, args.cluster_json)

    print(f"Importing {len(df):,} rows into database...")
    inserted = save_violations_from_dataframe(df, clear_existing=True)
    print(f"Done. Imported {inserted:,} violation rows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
