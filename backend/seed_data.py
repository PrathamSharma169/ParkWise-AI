"""
ParkWise AI - Seed Data Generator

Generates a realistic-looking hotspots.json and recommendations.json
for Bengaluru when the real CSV pipeline output is not available.

Uses well-known Bengaluru neighbourhoods and feeds the data through the
existing impact-score + zone-classification + rule-engine logic so the
output is identical in shape to what data_processor.py would produce.
"""

import json
import os
import random
from pathlib import Path

import numpy as np

from recommendations import generate_zone_recommendation


# ============================================================
# Bengaluru zones — realistic spread across the city
# ============================================================
BENGALURU_ZONES = [
    # (zone_name, lat, lon, police_station, base_violations)
    ("Koramangala - 80 Feet Road Zone", 12.9352, 77.6245, "Koramangala PS", 612),
    ("Indiranagar - 100 Feet Road Zone", 12.9719, 77.6412, "Indiranagar PS", 587),
    ("MG Road - Brigade Junction Zone", 12.9756, 77.6097, "Cubbon Park PS", 553),
    ("Whitefield - ITPL Main Road Zone", 12.9698, 77.7500, "Whitefield PS", 498),
    ("HSR Layout - 27th Main Zone", 12.9116, 77.6473, "HSR Layout PS", 472),
    ("BTM Layout - 16th Main Zone", 12.9166, 77.6101, "BTM Layout PS", 446),
    ("Jayanagar - 11th Main Zone", 12.9250, 77.5938, "Jayanagar PS", 421),
    ("Madiwala - Hosur Road Zone", 12.9249, 77.6155, "Madiwala PS", 398),
    ("Marathahalli - Outer Ring Road Zone", 12.9591, 77.6974, "Marathahalli PS", 376),
    ("Electronic City - Phase 1 Zone", 12.8456, 77.6603, "Electronic City PS", 354),
    ("Hebbal - Bellary Road Zone", 13.0354, 77.5970, "Hebbal PS", 332),
    ("Yeshwanthpur - Tumkur Road Zone", 13.0287, 77.5400, "Yeshwanthpur PS", 311),
    ("Banashankari - Kanakapura Road Zone", 12.9249, 77.5468, "Banashankari PS", 289),
    ("RT Nagar - Bellary Road Zone", 13.0238, 77.5905, "RT Nagar PS", 267),
    ("Malleshwaram - Sampige Road Zone", 13.0036, 77.5644, "Malleshwaram PS", 245),
    ("Domlur - Inner Ring Road Zone", 12.9606, 77.6386, "Domlur PS", 224),
    ("Sarjapur Road - Bellandur Zone", 12.9259, 77.6772, "Bellandur PS", 203),
    ("Ulsoor - CMH Road Zone", 12.9826, 77.6232, "Ulsoor PS", 182),
    ("Rajajinagar - West of Chord Road", 13.0072, 77.5523, "Rajajinagar PS", 161),
    ("Vijayanagar - Magadi Road Zone", 12.9678, 77.5390, "Vijayanagar PS", 145),
    ("Basavanagudi - Bull Temple Road", 12.9416, 77.5731, "Basavanagudi PS", 132),
    ("JP Nagar - 24th Main Zone", 12.9082, 77.5855, "JP Nagar PS", 121),
    ("Frazer Town - Mosque Road Zone", 13.0048, 77.6133, "Frazer Town PS", 108),
    ("Cox Town - Wheeler Road Zone", 13.0014, 77.6178, "Cox Town PS", 96),
    ("Shivajinagar - Commercial St Zone", 12.9847, 77.6055, "Shivajinagar PS", 87),
    ("Yelahanka - New Town Zone", 13.1007, 77.5963, "Yelahanka PS", 76),
    ("Bommanahalli - Hosur Road Zone", 12.9061, 77.6189, "Bommanahalli PS", 68),
    ("KR Puram - Old Madras Road Zone", 12.9994, 77.6967, "KR Puram PS", 59),
    ("Hennur - Banaswadi Main Road", 13.0301, 77.6418, "Banaswadi PS", 52),
    ("Mahadevapura - ITPL Road Zone", 12.9892, 77.7158, "Mahadevapura PS", 47),
    ("Cubbon Park - Kasturba Road Zone", 12.9762, 77.5929, "Cubbon Park PS", 41),
    ("Lavelle Road - Vittal Mallya Road", 12.9683, 77.5972, "Cubbon Park PS", 38),
    ("Richmond Town - Richmond Road", 12.9628, 77.6014, "Cubbon Park PS", 34),
    ("Sadashivanagar - Bellary Road", 13.0091, 77.5806, "Sadashivanagar PS", 31),
    ("Wilson Garden - Hosur Road Zone", 12.9508, 77.5984, "Wilson Garden PS", 28),
    ("Adugodi - Audugodi Main Road", 12.9377, 77.6064, "Audugodi PS", 24),
    ("Cunningham Road - Junction Zone", 12.9851, 77.5946, "Cubbon Park PS", 21),
    ("Chamrajpet - 4th Main Zone", 12.9533, 77.5598, "Chamrajpet PS", 18),
    ("Kengeri - Mysore Road Zone", 12.9081, 77.4847, "Kengeri PS", 16),
    ("Peenya - Industrial Area Zone", 13.0286, 77.5152, "Peenya PS", 14),
]

VEHICLE_WEIGHTS = {"BIKE": 1, "AUTO": 2, "CAR": 3, "MAXI CAB": 4, "BUS": 5, "TRUCK": 5, "OTHERS": 2}

VIOLATION_TYPES_POOL = [
    "WRONG PARKING", "NO PARKING ZONE", "FOOTPATH PARKING",
    "DOUBLE PARKING", "OBSTRUCTING TRAFFIC", "JUNCTION PARKING",
]

ROADS_POOL = [
    "Main Road", "Cross Road", "Service Road", "Outer Ring Road",
    "Inner Ring Road", "Bypass Road", "Junction Circle",
]


def _vehicle_distribution(total: int, seed: int) -> dict:
    rnd = random.Random(seed)
    weights = {"CAR": 0.32, "BIKE": 0.38, "AUTO": 0.14, "MAXI CAB": 0.06,
               "BUS": 0.04, "TRUCK": 0.04, "OTHERS": 0.02}
    dist = {}
    remaining = total
    items = list(weights.items())
    for i, (vt, w) in enumerate(items):
        if i == len(items) - 1:
            dist[vt] = remaining
        else:
            jitter = rnd.uniform(0.85, 1.15)
            n = max(0, int(total * w * jitter))
            n = min(n, remaining)
            dist[vt] = n
            remaining -= n
    return dist


def _hourly_distribution(total: int, seed: int) -> dict:
    """Bimodal — morning rush (8-11) + evening rush (17-21)."""
    rnd = random.Random(seed + 1)
    weights = []
    for h in range(24):
        if 8 <= h <= 11:
            w = 0.10
        elif 17 <= h <= 21:
            w = 0.11
        elif 12 <= h <= 16:
            w = 0.05
        elif 22 <= h <= 23 or 0 <= h <= 6:
            w = 0.015
        else:
            w = 0.04
        weights.append(w * rnd.uniform(0.8, 1.2))
    s = sum(weights)
    weights = [w / s for w in weights]
    counts = {}
    remaining = total
    for h in range(24):
        if h == 23:
            counts[str(h)] = remaining
        else:
            n = int(total * weights[h])
            counts[str(h)] = n
            remaining -= n
    return counts


def _top_locations(zone_name: str, total: int, seed: int) -> list:
    rnd = random.Random(seed + 2)
    base = zone_name.replace(" Zone", "")
    n_roads = rnd.randint(3, 5)
    roads = []
    used_counts = 0
    for i in range(n_roads):
        road_suffix = rnd.choice(ROADS_POOL)
        name = f"{rnd.randint(1, 30)}{['st','nd','rd','th'][min(rnd.randint(0,3),3)]} {road_suffix}"
        share = (0.45 / (i + 1)) * rnd.uniform(0.7, 1.15)
        count = max(1, int(total * share))
        if used_counts + count > total:
            count = max(1, total - used_counts)
        used_counts += count
        roads.append({"name": f"{name}, {base.split(' - ')[0]}", "count": count})
        if used_counts >= total:
            break
    return roads


def _violation_types(total: int, seed: int) -> dict:
    rnd = random.Random(seed + 3)
    types = {}
    remaining = total
    pool = VIOLATION_TYPES_POOL[:]
    rnd.shuffle(pool)
    for i, vt in enumerate(pool):
        if i == len(pool) - 1:
            types[vt] = remaining
        else:
            share = rnd.uniform(0.10, 0.30)
            n = min(remaining, int(total * share))
            types[vt] = n
            remaining -= n
    return types


def _build_clusters() -> list:
    rnd = random.Random(42)
    clusters = []
    for idx, (zone_name, lat, lon, station, base_v) in enumerate(BENGALURU_ZONES):
        total = base_v + rnd.randint(-10, 10)
        seed = idx * 7
        veh_dist = _vehicle_distribution(total, seed)

        # avg weighted vehicle weight
        if total > 0:
            avg_w = sum(VEHICLE_WEIGHTS.get(v, 2) * c for v, c in veh_dist.items()) / total
        else:
            avg_w = 2.0

        junction_ratio = round(rnd.uniform(0.05, 0.78), 3)
        avg_resolution = round(rnd.uniform(2.0, 72.0), 2)

        clusters.append({
            "cluster_id": idx,
            "center_lat": float(lat) + rnd.uniform(-0.005, 0.005),
            "center_lon": float(lon) + rnd.uniform(-0.005, 0.005),
            "zone_name": zone_name,
            "total_violations": int(total),
            "vehicle_distribution": veh_dist,
            "avg_vehicle_weight": float(avg_w),
            "junction_ratio": junction_ratio,
            "avg_resolution_time": avg_resolution,
            "top_locations": _top_locations(zone_name, total, seed),
            "hourly_distribution": _hourly_distribution(total, seed),
            "police_station": station,
            "violation_types": _violation_types(total, seed),
            "top_vehicles": [
                {"type": v, "count": c}
                for v, c in sorted(veh_dist.items(), key=lambda x: -x[1])[:5]
            ],
            "top_vehicle_type": max(veh_dist, key=veh_dist.get) if veh_dist else "UNKNOWN",
        })
    return clusters


def _compute_impact(clusters: list) -> list:
    """Replicates data_processor.compute_impact_scores logic."""
    violations = np.array([c["total_violations"] for c in clusters])
    vehicle_weights = np.array([c["avg_vehicle_weight"] for c in clusters])
    junction_ratios = np.array([c["junction_ratio"] for c in clusters])
    resolution_times = np.array([c["avg_resolution_time"] for c in clusters])

    def norm(a):
        if a.max() == a.min():
            return np.zeros_like(a)
        return (a - a.min()) / (a.max() - a.min())

    impact = (
        0.45 * norm(violations) +
        0.25 * norm(vehicle_weights) +
        0.15 * norm(junction_ratios) +
        0.15 * norm(resolution_times)
    ) * 100

    p25, p50, p75, p90 = (np.percentile(violations, p) for p in (25, 50, 75, 90))
    ip25, ip50, ip75, ip90 = (np.percentile(impact, p) for p in (25, 50, 75, 90))

    for i, c in enumerate(clusters):
        c["impact_score"] = float(round(impact[i], 1))
        c["vehicle_impact_score"] = float(norm(vehicle_weights)[i])
        v = c["total_violations"]
        c["violation_percentile"] = (
            "P90" if v >= p90 else "P75" if v >= p75 else "P50" if v >= p50 else "P25"
        )
        s = impact[i]
        c["impact_percentile"] = (
            "P90" if s >= ip90 else "P75" if s >= ip75 else "P50" if s >= ip50 else "P25"
        )

    clusters.sort(key=lambda x: -x["impact_score"])
    for rank, c in enumerate(clusters, 1):
        c["impact_rank"] = rank
    for rank, c in enumerate(sorted(clusters, key=lambda x: -x["total_violations"]), 1):
        c["density_rank"] = rank
    return clusters


def _generate_recommendations(clusters: list) -> list:
    recs = []
    for c in clusters:
        zone_data = {
            "zone_id": c["cluster_id"],
            "zone_name": c["zone_name"],
            "impact_score": c["impact_score"],
            "total_violations": c["total_violations"],
            "violation_percentile": c["violation_percentile"],
            "impact_percentile": c["impact_percentile"],
            "vehicle_impact_score": c["vehicle_impact_score"],
            "junction_ratio": c["junction_ratio"],
            "avg_resolution_time": c["avg_resolution_time"],
            "top_vehicle_type": c["top_vehicle_type"],
            "density_rank": c["density_rank"],
            "impact_rank": c["impact_rank"],
            "top_locations": c["top_locations"],
        }
        rec = generate_zone_recommendation(zone_data)
        c["zone_classification"] = rec["zone_classification"]
        recs.append(rec)
    return recs


def ensure_seed_data() -> None:
    """Create data/hotspots.json + recommendations.json if missing."""
    backend_dir = Path(__file__).parent
    data_dir = backend_dir / "data"
    hotspots_path = data_dir / "hotspots.json"
    recs_path = data_dir / "recommendations.json"

    if hotspots_path.exists() and recs_path.exists():
        return

    print("[seed_data] Generating seed dataset for Bengaluru zones...")
    data_dir.mkdir(parents=True, exist_ok=True)

    clusters = _build_clusters()
    clusters = _compute_impact(clusters)
    recommendations = _generate_recommendations(clusters)

    with open(hotspots_path, "w") as f:
        json.dump(clusters, f, indent=2, default=str)
    with open(recs_path, "w") as f:
        json.dump(recommendations, f, indent=2, default=str)

    print(f"[seed_data] Wrote {len(clusters)} hotspots → {hotspots_path}")
    print(f"[seed_data] Wrote {len(recommendations)} recommendations → {recs_path}")


if __name__ == "__main__":
    ensure_seed_data()
