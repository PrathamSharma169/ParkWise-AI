"""
SQLAlchemy models for ParkWise AI database tables.
"""

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, JSON
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


class Violation(Base):
    """Raw parking violation records used for date filtering and trends."""
    __tablename__ = "violations"

    id = Column(String(64), primary_key=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Text, nullable=False, default="")
    vehicle_type_clean = Column(String(32), nullable=False)
    violation_type = Column(Text)
    police_station = Column(String(255), nullable=False, default="Unknown")
    junction_name = Column(String(255), nullable=False, default="No Junction")
    created_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    closed_datetime = Column(DateTime(timezone=True))
    hour = Column(Integer, nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    resolution_hours = Column(Float)
    is_junction = Column(Integer, nullable=False, default=0)
    cluster_id = Column(Integer, nullable=False, index=True)

    __table_args__ = (
        Index("ix_violations_created_cluster", "created_datetime", "cluster_id"),
    )
