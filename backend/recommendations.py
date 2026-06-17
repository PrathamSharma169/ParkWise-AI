"""
Rule-based Recommendation Engine for ParkWise AI.
Generates actionable enforcement recommendations based on zone analytics.
"""


def generate_recommendations(zone_data: dict) -> list:
    """
    Generate recommendations for a parking hotspot zone.
    
    Args:
        zone_data: Dictionary containing zone analytics:
            - zone_id: int
            - zone_name: str
            - impact_score: float
            - total_violations: int
            - vehicle_impact_score: float  (normalized 0-1)
            - junction_ratio: float  (0-1)
            - avg_resolution_time: float  (hours)
            - top_vehicle_type: str
            - density_rank: int
            - impact_rank: int
    
    Returns:
        List of recommendation dictionaries.
    """
    recommendations = []
    zone_id = zone_data.get("zone_id")
    impact_score = zone_data.get("impact_score", 0)
    vehicle_impact = zone_data.get("vehicle_impact_score", 0)
    junction_ratio = zone_data.get("junction_ratio", 0)
    avg_resolution = zone_data.get("avg_resolution_time", 0)
    total_violations = zone_data.get("total_violations", 0)
    density_rank = zone_data.get("density_rank", 999)
    impact_rank = zone_data.get("impact_rank", 999)
    top_vehicle = zone_data.get("top_vehicle_type", "UNKNOWN")

    # --- Rule 1: High Vehicle Impact ---
    if vehicle_impact > 0.7:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Increase towing patrol frequency",
            "reason": f"High concentration of large vehicles ({top_vehicle} dominant). "
                      f"Vehicle impact score: {vehicle_impact:.2f}",
            "priority": "Critical" if vehicle_impact > 0.85 else "High",
            "expected_benefit": "Reduce road blockage by 40-60% during peak hours",
            "category": "Towing"
        })

    # --- Rule 2: High Junction Impact ---
    if junction_ratio > 0.4:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Deploy traffic officers near junction",
            "reason": f"{junction_ratio*100:.0f}% of violations occur near junctions, "
                      f"causing intersection gridlock",
            "priority": "Critical" if junction_ratio > 0.6 else "High",
            "expected_benefit": "Improve junction throughput by 30-50%",
            "category": "Deployment"
        })

    # --- Rule 3: Long Enforcement Time ---
    if avg_resolution > 24:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Assign dedicated enforcement team",
            "reason": f"Average resolution time is {avg_resolution:.1f} hours. "
                      f"Violations persist too long before action",
            "priority": "Critical" if avg_resolution > 72 else "High",
            "expected_benefit": "Reduce average resolution time by 60%",
            "category": "Enforcement"
        })

    # --- Rule 4: Repeat Offender Zone ---
    if total_violations > 200:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Install permanent no-parking barriers and signage",
            "reason": f"Zone has {total_violations} recorded violations, "
                      f"indicating chronic repeat offenses",
            "priority": "High" if total_violations > 500 else "Medium",
            "expected_benefit": "Deter repeat violations by 70% with physical barriers",
            "category": "Infrastructure"
        })

    # --- Rule 5: Hidden High Impact Zone ---
    if impact_rank <= 10 and density_rank > 20:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Prioritize for immediate enforcement review",
            "reason": f"Hidden hotspot: Impact rank #{impact_rank} but density rank "
                      f"#{density_rank}. This zone causes disproportionate disruption "
                      f"relative to violation count",
            "priority": "Critical",
            "expected_benefit": "Address overlooked high-impact areas before they escalate",
            "category": "Strategic"
        })

    # --- Rule 6: Overall Critical Zone ---
    if impact_score >= 75:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Implement multi-modal enforcement strategy",
            "reason": f"Impact score of {impact_score:.0f}/100 places this zone in "
                      f"critical severity. Requires combined towing, officer deployment, "
                      f"and infrastructure measures",
            "priority": "Critical",
            "expected_benefit": "Comprehensive reduction in parking violations and traffic disruption",
            "category": "Strategic"
        })

    # --- Rule 7: Moderate Zone - Preventive ---
    if 50 <= impact_score < 75 and not recommendations:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Schedule periodic enforcement patrols",
            "reason": f"Moderate impact score ({impact_score:.0f}/100). "
                      f"Regular monitoring can prevent escalation",
            "priority": "Medium",
            "expected_benefit": "Prevent zone from escalating to high-risk status",
            "category": "Patrol"
        })

    # --- Rule 8: Low priority zones still get a recommendation ---
    if not recommendations:
        recommendations.append({
            "zone_id": zone_id,
            "action": "Continue routine monitoring",
            "reason": f"Zone shows manageable violation levels (score: {impact_score:.0f}/100)",
            "priority": "Low",
            "expected_benefit": "Maintain current compliance levels",
            "category": "Monitoring"
        })

    return recommendations
