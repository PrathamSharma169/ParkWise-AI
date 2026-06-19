"""
ParkWise AI - Backend API Test Suite
Tests all /api/* endpoints from main.py
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://smart-parking-hub-43.preview.emergentagent.com").rstrip("/")
TIMEOUT = 120  # Gemini calls can be slow


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ============ Hotspots ============
class TestHotspots:
    def test_get_all_hotspots(self, session):
        r = session.get(f"{BASE_URL}/api/hotspots", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 40
        required = {"zone_id", "zone_name", "lat", "lon", "impact_score",
                    "impact_rank", "density_rank", "total_violations",
                    "violation_percentile", "police_station"}
        for h in data:
            assert required.issubset(h.keys()), f"Missing keys: {required - h.keys()}"

    def test_hotspot_detail_valid(self, session):
        r = session.get(f"{BASE_URL}/api/hotspot/1", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["zone_id"] == 1
        for k in ("vehicle_distribution", "top_locations", "hourly_distribution",
                  "zone_classification", "recommendations"):
            assert k in data
        assert isinstance(data["recommendations"], list)
        assert all(isinstance(s, str) for s in data["recommendations"])

    def test_hotspot_detail_invalid_404(self, session):
        r = session.get(f"{BASE_URL}/api/hotspot/99999", timeout=30)
        assert r.status_code == 404


# ============ Density / Impact Maps ============
class TestMaps:
    def test_density_map(self, session):
        r = session.get(f"{BASE_URL}/api/density-map", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 40
        valid_risks = {"Critical", "High", "Moderate", "Low"}
        for m in data:
            assert m["risk"] in valid_risks
            assert m["color"].startswith("#")
            assert isinstance(m["lat"], (int, float))
            assert isinstance(m["lon"], (int, float))

    def test_impact_map(self, session):
        r = session.get(f"{BASE_URL}/api/impact-map", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 40
        valid_sev = {"Critical", "High", "Moderate", "Low"}
        for m in data:
            assert m["severity"] in valid_sev
            assert "impact_score" in m
            assert "impact_rank" in m
            assert m["color"].startswith("#")


# ============ Analytics ============
class TestAnalytics:
    def test_analytics_structure(self, session):
        r = session.get(f"{BASE_URL}/api/analytics", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["total_zones"] == 40
        assert data["total_violations"] > 0
        sd = data["severity_distribution"]
        for k in ("critical", "high", "moderate", "low"):
            assert k in sd and isinstance(sd[k], int)
        assert len(data["top_impact_zones"]) == 10
        assert len(data["top_density_zones"]) == 10
        assert isinstance(data["overlooked_zones"], list)
        assert isinstance(data["police_stations"], list)
        assert isinstance(data["vehicle_distribution"], dict)


# ============ Recommendations ============
class TestRecommendations:
    def test_all_recommendations(self, session):
        r = session.get(f"{BASE_URL}/api/recommendations", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 40
        assert isinstance(data["all"], list)
        assert len(data["all"]) == 40
        cc = data["classification_counts"]
        assert isinstance(cc, dict)
        assert cc.get("Critical Zone", 0) >= 1
        assert isinstance(data["by_classification"], dict)
        bp = data["by_priority"]
        for k in ("Critical", "High", "Medium", "Low"):
            assert k in bp

    def test_recommendation_detail_valid(self, session):
        r = session.get(f"{BASE_URL}/api/recommendation/1", timeout=30)
        assert r.status_code == 200
        data = r.json()
        for k in ("zone_classification", "recommendations", "priority",
                  "density_rank", "impact_rank"):
            assert k in data, f"missing {k}"
        assert isinstance(data["recommendations"], list)
        assert all(isinstance(s, str) for s in data["recommendations"])

    def test_recommendation_detail_invalid(self, session):
        r = session.get(f"{BASE_URL}/api/recommendation/99999", timeout=30)
        assert r.status_code == 404


# ============ Gemini Explanation ============
class TestExplain:
    def test_explain_returns_valid_object(self, session):
        # Use a less popular zone_id to avoid clash with manual testing cache
        r = session.post(f"{BASE_URL}/api/recommendation/3/explain", timeout=TIMEOUT)
        assert r.status_code == 200, f"got {r.status_code} body={r.text[:300]}"
        data = r.json()
        for k in ("risk_summary", "key_risk_factors",
                  "recommendation_explanation", "expected_benefit"):
            assert k in data, f"missing {k}"
        assert isinstance(data["risk_summary"], str) and len(data["risk_summary"]) > 0
        assert isinstance(data["key_risk_factors"], list)
        assert len(data["recommendation_explanation"]) > 0
        assert len(data["expected_benefit"]) > 0

    def test_explain_cached_on_second_call(self, session):
        r1 = session.post(f"{BASE_URL}/api/recommendation/5/explain", timeout=TIMEOUT)
        assert r1.status_code == 200
        d1 = r1.json()
        r2 = session.post(f"{BASE_URL}/api/recommendation/5/explain", timeout=30)
        assert r2.status_code == 200
        d2 = r2.json()
        # Same cached content
        assert d1["risk_summary"] == d2["risk_summary"]
        assert d1["recommendation_explanation"] == d2["recommendation_explanation"]

    def test_explain_invalid_zone_404(self, session):
        r = session.post(f"{BASE_URL}/api/recommendation/99999/explain", timeout=30)
        assert r.status_code == 404
