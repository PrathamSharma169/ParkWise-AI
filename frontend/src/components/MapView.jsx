import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker, Tooltip } from "react-leaflet";
import { Activity, AlertTriangle, Search, X } from "lucide-react";
import { getDensityMap, getImpactMap, getHotspotDetail } from "@/utils/api";
import ZoneDetails from "@/components/ZoneDetails";

// Patch Leaflet to avoid crash when map is unmounted during zoom transitions
if (typeof window !== "undefined" && L && L.Map) {
  if (L.Map.prototype._onZoomTransitionEnd) {
    const originalOnZoomTransitionEnd = L.Map.prototype._onZoomTransitionEnd;
    L.Map.prototype._onZoomTransitionEnd = function (...args) {
      if (this._mapPane) {
        originalOnZoomTransitionEnd.apply(this, args);
      }
    };
  }
  if (L.Map.prototype._getMapPanePos) {
    const originalGetMapPanePos = L.Map.prototype._getMapPanePos;
    L.Map.prototype._getMapPanePos = function (...args) {
      if (this._mapPane) {
        return originalGetMapPanePos.apply(this, args);
      }
      return new L.Point(0, 0);
    };
  }
  if (L.Map.prototype.panBy) {
    const originalPanBy = L.Map.prototype.panBy;
    L.Map.prototype.panBy = function (...args) {
      if (this._mapPane) {
        return originalPanBy.apply(this, args);
      }
      return this;
    };
  }
}

const BENGALURU_CENTER = [12.9716, 77.5946];

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}

function MapBoundsFitter({ highlightedMarkers }) {
  const map = useMap();

  useEffect(() => {
    if (!highlightedMarkers || highlightedMarkers.length === 0) return;

    const points = highlightedMarkers.map((m) => [m.lat, m.lon]);
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 12.5,
        animate: true,
        duration: 1.5,
      });
    }
  }, [highlightedMarkers, map]);

  return null;
}

function severityColor(severity) {
  return {
    Critical: "#D90429",
    High: "#EF8354",
    Moderate: "#E9C46A",
    Low: "#2D6A4F",
  }[severity] || "#8C9298";
}

export default function MapView({ startDate, endDate }) {
  const [mode, setMode] = useState("density"); // 'density' | 'impact'
  const [density, setDensity] = useState([]);
  const [impact, setImpact] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMaps, setLoadingMaps] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingMaps(true);
    Promise.all([
      getDensityMap(startDate, endDate),
      getImpactMap(startDate, endDate),
    ])
      .then(([d, i]) => {
        if (!cancelled) {
          setDensity(d);
          setImpact(i);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDensity([]);
          setImpact([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMaps(false);
      });
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  useEffect(() => {
    if (selected === null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    getHotspotDetail(selected, startDate, endDate)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [selected, startDate, endDate]);

  const markers = mode === "density" ? density : impact;

  const filteredMarkers = useMemo(() => {
    if (!search.trim()) return markers;
    const q = search.toLowerCase();
    return markers.filter((m) =>
      (m.zone_name || "").toLowerCase().includes(q)
    );
  }, [markers, search]);

  const highlightedMarkers = useMemo(() => {
    if (!markers || markers.length === 0) return [];

    const criticals = [];
    const highs = [];
    const moderates = [];

    markers.forEach((m) => {
      const cat = m.severity || m.risk || "Low";
      if (cat === "Critical") {
        criticals.push(m);
      } else if (cat === "High") {
        highs.push(m);
      } else if (cat === "Moderate") {
        moderates.push(m);
      }
    });

    const sortFn = (a, b) => {
      if (mode === "impact") {
        return (b.impact_score || 0) - (a.impact_score || 0);
      } else {
        const valA = a.violations ?? a.total_violations ?? 0;
        const valB = b.violations ?? b.total_violations ?? 0;
        return valB - valA;
      }
    };

    criticals.sort(sortFn);
    highs.sort(sortFn);
    moderates.sort(sortFn);

    const result = [];
    if (criticals.length > 0) result.push(criticals[0]);
    if (highs.length > 0) result.push(highs[0]);
    if (moderates.length > 0) result.push(moderates[0]);

    return result;
  }, [markers, mode]);

  const highlightedIds = useMemo(() => {
    return new Set(highlightedMarkers.map((m) => m.zone_id));
  }, [highlightedMarkers]);

  async function openZone(zoneId) {
    setSelected(zoneId);
  }

  function closeZone() {
    setSelected(null);
    setDetail(null);
  }

  return (
    <div className="page-shell" data-testid="map-page">
      {/* Page header */}
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>
            {mode === "density"
              ? "Where the city breaks down."
              : "Which break down to fix first."}
          </h2>
          <p>
            {mode === "density"
              ? "Marker size and colour map to violation density percentile (P25 → P90)."
              : "Composite Impact Score — violation density, vehicle weight, junction risk and enforcement difficulty rolled into one rank."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-pill)",
            minWidth: 240,
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              data-testid="map-search"
              placeholder="Search zone, e.g. Koramangala"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                width: "100%", fontSize: 13.5, fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="clear" data-testid="map-search-clear">
                <X size={14} color="var(--text-muted)" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className={`map-frame ${loadingMaps ? "map-frame--loading" : ""}`} data-testid="map-frame">
        <MapContainer
          center={BENGALURU_CENTER}
          zoom={10.6}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <MapInvalidator />
          <MapBoundsFitter highlightedMarkers={highlightedMarkers} />
          <TileLayer
            attribution='&copy; OpenStreetMap, &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {filteredMarkers.map((m) => {
            const color = m.color || severityColor(m.severity || m.risk);
            const radius =
              mode === "impact"
                ? Math.max(8, Math.min(24, (m.impact_score || 0) / 4))
                : 10 + (m.impact_rank ? Math.max(0, 16 - m.impact_rank / 3) : 0);
            const isHighlighted = highlightedIds.has(m.zone_id);

            return (
              <React.Fragment key={`${mode}-${m.zone_id}`}>
                {isHighlighted && (
                  <Marker
                    position={[m.lat, m.lon]}
                    icon={L.divIcon({
                      className: "custom-wavy-marker",
                      html: `
                        <div class="wavy-ring" style="border-color: ${color}"></div>
                        <div class="wavy-ring-outer" style="border-color: ${color}"></div>
                        <div class="wavy-dot" style="background-color: ${color}"></div>
                      `,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    })}
                    eventHandlers={{
                      click: () => openZone(m.zone_id),
                    }}
                  >
                    <Tooltip 
                      permanent 
                      direction="top" 
                      offset={[0, -12]}
                      className="highlight-tooltip"
                      interactive={true}
                      eventHandlers={{
                        click: () => openZone(m.zone_id),
                      }}
                    >
                      <div 
                        style={{ padding: "2px 4px", cursor: "pointer" }}
                        onClick={() => openZone(m.zone_id)}
                      >
                        <div style={{ fontWeight: 700, fontSize: 10, lineHeight: 1.2 }}>{m.zone_name}</div>
                        <div style={{ fontSize: 9, opacity: 0.9, whiteSpace: "nowrap", marginTop: 2 }}>
                          {mode === "impact" ? `Impact: ${m.impact_score.toFixed(1)}` : `Violations: ${(m.violations ?? m.total_violations).toLocaleString()}`}
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                )}

                <CircleMarker
                  center={[m.lat, m.lon]}
                  radius={radius}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: loadingMaps ? 0.35 : isHighlighted ? 0.9 : 0.72,
                    weight: isHighlighted ? 3 : 2,
                    className: loadingMaps ? "leaflet-marker-loading" : "leaflet-marker-pulse",
                  }}
                  eventHandlers={{
                    click: () => openZone(m.zone_id),
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div className="overline" style={{ marginBottom: 4 }}>
                        Zone #{m.zone_id}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                        {m.zone_name}
                      </div>
                      {(m.impact_score !== undefined) && (
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          fontSize: 12, color: "var(--text-secondary)",
                        }}>
                          <span>Impact</span>
                          <strong style={{ color: "var(--text-primary)" }}>{m.impact_score.toFixed(1)}</strong>
                        </div>
                      )}
                      {(m.violations !== undefined || m.total_violations !== undefined) && (
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          fontSize: 12, color: "var(--text-secondary)", marginBottom: 10,
                        }}>
                          <span>Violations</span>
                          <strong style={{ color: "var(--text-primary)" }}>
                            {(m.violations ?? m.total_violations).toLocaleString()}
                          </strong>
                        </div>
                      )}
                      <button
                        className="btn btn-primary"
                        style={{ padding: "8px 14px", fontSize: 12, width: "100%" }}
                        onClick={() => openZone(m.zone_id)}
                        data-testid={`open-zone-${m.zone_id}`}
                      >
                        Open field briefing
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Mode switch */}
        <div className="map-overlay map-mode-switch">
          <button
            id="toggle-density-map"
            data-testid="toggle-density-map"
            className={`map-mode-pill ${mode === "density" ? "active density" : ""}`}
            onClick={() => setMode("density")}
          >
            <Activity size={14} />
            Density
          </button>
          <button
            id="toggle-impact-map"
            data-testid="toggle-impact-map"
            className={`map-mode-pill ${mode === "impact" ? "active impact" : ""}`}
            onClick={() => setMode("impact")}
          >
            <AlertTriangle size={14} />
            Impact
          </button>
        </div>

        {/* Legend */}
        <div className="map-overlay map-legend">
          <span className="overline">
            {mode === "density" ? "Violation Density" : "Operational Impact"}
          </span>
          {["Critical", "High", "Moderate", "Low"].map((label) => (
            <div className="row" key={label}>
              <span className="dot" style={{ background: severityColor(label) }} />
              <span style={{ color: "var(--text-secondary)" }}>{label}</span>
            </div>
          ))}
          <div style={{
            marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)",
            fontSize: 11, color: "var(--text-muted)",
          }}>
            {loadingMaps ? "Updating for selected dates…" : `${filteredMarkers.length} of ${markers.length} zones shown`}
          </div>
        </div>
      </div>

      {/* Field briefing right panel */}
      {selected !== null && (
        <ZoneDetails
          detail={detail}
          loading={loadingDetail}
          onClose={closeZone}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
