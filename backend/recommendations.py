"""
ParkWise AI — Zone Classification Engine + Rule-Based Recommendation Engine

Architecture:
    Hotspot Data → Zone Classification → Rule Engine → Recommendations
    (Gemini 2.5 Flash is called separately for explanations, NOT for decisions)

Zone Classifications (using relative percentiles):
    1. Critical Zone:           density ≥ P75 AND impact ≥ P75
    2. Frequent Violation Zone: density ≥ P75 AND impact < P50
    3. Hidden Risk Zone:        density < P50 AND impact ≥ P75
    4. Stable Zone:             density < P50 AND impact < P50
    5. Moderate Zone:           everything else (fallback)
"""


# ============================================================
# Percentile rank ordering (for comparison operators)
# ============================================================
PERCENTILE_ORDER = {"P25": 0, "P50": 1, "P75": 2, "P90": 3}


def _percentile_gte(p, threshold):
    """Check if percentile p >= threshold (e.g. 'P90' >= 'P75')."""
    return PERCENTILE_ORDER.get(p, 0) >= PERCENTILE_ORDER.get(threshold, 0)


def _percentile_lt(p, threshold):
    """Check if percentile p < threshold (e.g. 'P50' < 'P75')."""
    return PERCENTILE_ORDER.get(p, 0) < PERCENTILE_ORDER.get(threshold, 0)


# ============================================================
# Zone Classification Engine
# ============================================================

def classify_zone(zone_data: dict) -> str:
    """
    Classify a hotspot zone based on density percentile and impact percentile.

    Uses RELATIVE percentiles for both density and impact so that
    classification adapts to the actual data distribution.

    Returns one of:
        'Critical Zone', 'Frequent Violation Zone', 'Hidden Risk Zone',
        'Stable Zone', 'Moderate Zone'
    """
    density_pct = zone_data.get("violation_percentile", "P25")
    impact_pct = zone_data.get("impact_percentile", "P25")

    # Classification 1: Critical Zone — high density + high impact
    if _percentile_gte(density_pct, "P75") and _percentile_gte(impact_pct, "P75"):
        return "Critical Zone"

    # Classification 2: Frequent Violation Zone — high density + low impact
    if _percentile_gte(density_pct, "P75") and _percentile_lt(impact_pct, "P50"):
        return "Frequent Violation Zone"

    # Classification 3: Hidden Risk Zone — low density + high impact
    if _percentile_lt(density_pct, "P50") and _percentile_gte(impact_pct, "P75"):
        return "Hidden Risk Zone"

    # Classification 4: Stable Zone — low density + low impact
    if _percentile_lt(density_pct, "P50") and _percentile_lt(impact_pct, "P50"):
        return "Stable Zone"

    # Fallback: Moderate Zone
    return "Moderate Zone"


# ============================================================
# Rule Engine — classification-based recommendations
# ============================================================

_CLASSIFICATION_RULES = {
    "Critical Zone": {
        "priority": "Critical",
        "recommendations": [
            "Immediate Enforcement Priority",
            "Increase Officer Presence",
            "Increase Towing Operations",
        ],
    },
    "Frequent Violation Zone": {
        "priority": "High",
        "recommendations": [
            "Improve Parking Infrastructure",
            "Install Additional Signage",
            "Public Awareness Campaign",
        ],
    },
    "Hidden Risk Zone": {
        "priority": "Critical",
        "recommendations": [
            "Targeted Enforcement",
            "Junction Monitoring",
            "Dedicated Patrol Team",
        ],
    },
    "Stable Zone": {
        "priority": "Low",
        "recommendations": [
            "Routine Monitoring",
        ],
    },
    "Moderate Zone": {
        "priority": "Medium",
        "recommendations": [
            "Schedule Periodic Enforcement Patrols",
            "Monitor Trend for Escalation",
        ],
    },
}


# ============================================================
# Advanced Rules — additive recommendations
# ============================================================

def _apply_advanced_rules(zone_data: dict, recommendations: list):
    """
    Apply additional rule-engine checks and append extra
    recommendations if conditions are met.  These supplement
    (never replace) the classification-based recommendations.
    """
    vehicle_impact = zone_data.get("vehicle_impact_score", 0)
    junction_ratio = zone_data.get("junction_ratio", 0)
    avg_resolution = zone_data.get("avg_resolution_time", 0)
    total_violations = zone_data.get("total_violations", 0)

    # High Vehicle Impact (normalized score > 0.7  ≈ 70%)
    if vehicle_impact > 0.7:
        recommendations.append("Increase Towing Frequency")

    # High Junction Impact (ratio > 0.6  ≈ 60%)
    if junction_ratio > 0.6:
        recommendations.append("Deploy Officers Near Junction")

    # High Enforcement Difficulty (avg resolution > 24 hours)
    if avg_resolution > 24:
        recommendations.append("Dedicated Response Team")

    # Repeat Offender Zone
    if total_violations > 500:
        recommendations.append("Permanent Infrastructure Intervention")

    return recommendations


# ============================================================
# Public API
# ============================================================

def generate_zone_recommendation(zone_data: dict) -> dict:
    """
    Run the full classification + rule-engine pipeline for a single zone.

    Args:
        zone_data: dict with keys:
            zone_id, zone_name, impact_score, total_violations,
            violation_percentile, vehicle_impact_score, junction_ratio,
            avg_resolution_time, density_rank, impact_rank,
            top_locations (list)

    Returns:
        {
            "zone_id": int,
            "zone_name": str,
            "zone_classification": str,
            "density_rank": int,
            "impact_rank": int,
            "impact_score": float,
            "total_violations": int,
            "violation_percentile": str,
            "priority": str,
            "recommendations": [str, ...],
            "top_roads": [str, ...],
        }
    """
    classification = classify_zone(zone_data)
    rule = _CLASSIFICATION_RULES[classification]

    # Start with classification-based recommendations
    recommendations = list(rule["recommendations"])

    # Layer on advanced rules
    _apply_advanced_rules(zone_data, recommendations)

    # Extract top road names for Gemini prompt
    top_roads = []
    for loc in zone_data.get("top_locations", [])[:5]:
        name = loc.get("name", "") if isinstance(loc, dict) else str(loc)
        if name and name not in top_roads:
            top_roads.append(name)

    return {
        "zone_id": zone_data.get("zone_id"),
        "zone_name": zone_data.get("zone_name", "Unknown Zone"),
        "zone_classification": classification,
        "density_rank": zone_data.get("density_rank", 0),
        "impact_rank": zone_data.get("impact_rank", 0),
        "impact_score": zone_data.get("impact_score", 0),
        "total_violations": zone_data.get("total_violations", 0),
        "violation_percentile": zone_data.get("violation_percentile", "P25"),
        "priority": rule["priority"],
        "recommendations": recommendations,
        "top_roads": top_roads,
    }
