"""
SQLAlchemy models for ParkWise AI database tables.
"""

from sqlalchemy import Column, Integer, String, Float, Text, JSON
from database import Base


class Hotspot(Base):
    """Main hotspots table storing zone-level aggregated data."""
    __tablename__ = "hotspots"

    zone_id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(255), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    impact_score = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)           # Impact rank
    density_rank = Column(Integer, nullable=False)    # Violation density rank
    total_violations = Column(Integer, nullable=False)
    violation_percentile = Column(String(10))         # P25, P50, P75, P90
    police_station = Column(String(255))


class HotspotDetail(Base):
    """Detailed analytics for each hotspot zone."""
    __tablename__ = "hotspot_details"

    zone_id = Column(Integer, primary_key=True, index=True)
    vehicle_distribution = Column(JSON)   # {"CAR": 120, "BIKE": 80, ...}
    top_locations = Column(JSON)          # [{"name": "18th Main", "count": 45}, ...]
    hourly_distribution = Column(JSON)    # {"0": 5, "1": 3, ..., "23": 12}
    junction_ratio = Column(Float)        # Percentage of violations near junctions
    avg_resolution_time = Column(Float)   # Average hours to resolve
    violation_types = Column(JSON)        # {"WRONG PARKING": 200, ...}
    top_vehicles = Column(JSON)           # [{"type": "CAR", "count": 120}, ...]


class Recommendation(Base):
    """Enforcement recommendations for each hotspot zone."""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(Integer, index=True)
    action = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)     # Critical, High, Medium, Low
    expected_benefit = Column(Text)
    category = Column(String(50))                      # Towing, Deployment, Infrastructure, etc.
