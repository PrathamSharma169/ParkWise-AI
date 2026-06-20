import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Activity, AlertTriangle, Search, X } from "lucide-react";
import { getDensityMap, getImpactMap, getHotspotDetail } from "@/utils/api";
import ZoneDetails from "@/components/ZoneDetails";

const BENGALURU_CENTER = [12.9716, 77.5946];

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(id);
  }, [map]);
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
          zoom={10.4}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <MapInvalidator />
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
            return (
              <CircleMarker
                key={`${mode}-${m.zone_id}`}
                center={[m.lat, m.lon]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: loadingMaps ? 0.35 : 0.72,
                  weight: 2,
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
