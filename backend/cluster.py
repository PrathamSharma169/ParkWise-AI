"""
ParkWise AI - External DBSCAN Clustering Script

Run this script on a machine with sufficient RAM/CPU to handle the full dataset.
It performs:
  1. CSV loading & cleaning (same logic as data_processor.py)
  2. DBSCAN clustering
  3. Saves cluster labels to a JSON file

The JSON output can then be copied into the backend/ directory so
data_processor.py can pick it up instead of running DBSCAN locally.

Usage:
    python cluster.py
    python cluster.py --csv ../sample.csv --eps 500 --min-samples 20 --output cluster_labels.json
"""

import os
import json
import argparse
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN


# ============================================================
# CSV Cleaning  (must stay in sync with data_processor.py)
# ============================================================

def load_and_clean_for_clustering(csv_path: str) -> pd.DataFrame:
    """
    Load the CSV and apply the *exact same* row-removal steps as
    data_processor.load_and_clean_data() so that the resulting
    row count and order are identical.

    Only the columns needed for clustering (latitude, longitude)
    and the columns used for deduplication are required here.
    """
    print("[1/3] Loading dataset …")
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"  Loaded {len(df):,} records")

    # --- Remove rows with null coordinates ---
    initial = len(df)
    df = df.dropna(subset=["latitude", "longitude"])
    print(f"  Dropped {initial - len(df):,} rows with null coordinates")

    # --- Remove duplicate records ---
    dup_cols = ["latitude", "longitude", "vehicle_number", "created_datetime"]
    dup_count = df.duplicated(subset=dup_cols).sum()
    df = df.drop_duplicates(subset=dup_cols)
    print(f"  Dropped {dup_count:,} duplicate records")

    print(f"  Cleaned dataset: {len(df):,} records")
    return df


# ============================================================
# DBSCAN
# ============================================================

def run_dbscan(df: pd.DataFrame,
               eps_meters: float = 500,
               min_samples: int = 20) -> np.ndarray:
    """Run DBSCAN on lat/lon and return an array of cluster labels."""
    print("[2/3] Running DBSCAN clustering …")
    print(f"  eps = {eps_meters} m  |  min_samples = {min_samples}")

    coords = df[["latitude", "longitude"]].values

    # Convert eps from meters to radians (haversine needs radians)
    eps_radians = eps_meters / 6_371_000.0  # Earth radius in metres

    clustering = DBSCAN(
        eps=eps_radians,
        min_samples=min_samples,
        metric="haversine",
        algorithm="ball_tree",
    )

    coords_rad = np.radians(coords)
    labels = clustering.fit_predict(coords_rad)

    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = int((labels == -1).sum())

    print(f"  Clusters found : {n_clusters}")
    print(f"  Noise points   : {n_noise:,}")

    return labels


# ============================================================
# Save
# ============================================================

def save_labels(labels: np.ndarray,
                output_path: str,
                eps_meters: float,
                min_samples: int,
                total_rows: int):
    """Persist the cluster labels as a JSON file."""
    print("[3/3] Saving cluster labels …")

    n_clusters = int(len(set(labels)) - (1 if -1 in labels else 0))
    n_noise = int((labels == -1).sum())

    payload = {
        "metadata": {
            "eps_meters": eps_meters,
            "min_samples": min_samples,
            "total_rows": total_rows,
            "n_clusters": n_clusters,
            "n_noise": n_noise,
        },
        "cluster_labels": [int(x) for x in labels],
    }

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(payload, f)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"  Saved → {output_path}  ({size_kb:,.1f} KB)")


# ============================================================
# CLI entry-point
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="ParkWise AI – External DBSCAN Clustering",
    )
    parser.add_argument(
        "--csv", default=None,
        help="Path to the CSV file (default: ../sample.csv relative to this script)",
    )
    parser.add_argument(
        "--eps", type=float, default=500,
        help="DBSCAN eps in metres (default: 500)",
    )
    parser.add_argument(
        "--min-samples", type=int, default=20,
        help="DBSCAN min_samples (default: 20)",
    )
    parser.add_argument(
        "--output", default=None,
        help="Output JSON path (default: cluster_labels.json next to this script)",
    )

    args = parser.parse_args()

    # ---- Resolve paths ----
    script_dir = os.path.dirname(os.path.abspath(__file__))

    csv_path = args.csv or os.path.join(script_dir, "..", "sample.csv")
    csv_path = os.path.abspath(csv_path)

    output_path = args.output or os.path.join(script_dir, "cluster_labels.json")
    output_path = os.path.abspath(output_path)

    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found → {csv_path}")
        return

    # ---- Run ----
    print("=" * 60)
    print("  ParkWise AI – External DBSCAN Clustering")
    print("=" * 60)
    print(f"  CSV          : {csv_path}")
    print(f"  eps          : {args.eps} m")
    print(f"  min_samples  : {args.min_samples}")
    print(f"  Output       : {output_path}")
    print("=" * 60)

    df = load_and_clean_for_clustering(csv_path)
    labels = run_dbscan(df, eps_meters=args.eps, min_samples=args.min_samples)
    save_labels(labels, output_path, args.eps, args.min_samples, len(df))

    print("=" * 60)
    print("  Done!  Copy the JSON file into the backend/ directory,")
    print("  then run the main pipeline:  python data_processor.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
