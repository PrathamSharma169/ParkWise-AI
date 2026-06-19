import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import ZoneDetails from './ZoneDetails';
import { getDensityMap, getImpactMap, getHotspotDetail } from '../utils/api';

// Component to fit map bounds to markers
function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = markers.map(m => [m.lat, m.lon]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, map]);
  return null;
}

export default function MapView() {
  const [mapMode, setMapMode] = useState('density'); // 'density' or 'impact'
  const [markers, setMarkers] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDetail, setZoneDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch markers based on map mode
  useEffect(() => {
    async function loadMarkers() {
      setLoading(true);
      setError(null);
      try {
        const data = mapMode === 'density'
          ? await getDensityMap()
          : await getImpactMap();
        setMarkers(data);
      } catch (err) {
        setError(err.message);
        setMarkers([]);
      } finally {
        setLoading(false);
      }
    }
    loadMarkers();
  }, [mapMode]);

  // Fetch zone detail when a zone is selected
  useEffect(() => {
    if (selectedZone === null) {
      setZoneDetail(null);
      return;
    }
    async function loadDetail() {
      try {
        const data = await getHotspotDetail(selectedZone);
        setZoneDetail(data);
      } catch (err) {
        console.error('Failed to load zone detail:', err);
      }
    }
    loadDetail();
  }, [selectedZone]);

  const handleMarkerClick = (zoneId) => {
    setSelectedZone(zoneId);
  };

  // Determine marker size based on value
  const getMarkerRadius = (marker) => {
    if (mapMode === 'density') {
      const v = marker.violations || 0;
      if (v > 300) return 18;
      if (v > 150) return 14;
      if (v > 50) return 10;
      return 7;
    } else {
      // Use impact_percentile for sizing (adapts to data)
      const pct = marker.impact_percentile || 'P25';
      if (pct === 'P90') return 18;
      if (pct === 'P75') return 14;
      if (pct === 'P50') return 10;
      return 7;
    }
  };

  // Legend data
  const densityLegend = [
    { color: '#EF4444', label: 'Critical (P90+)' },
    { color: '#F97316', label: 'High (P75-P90)' },
    { color: '#EAB308', label: 'Moderate (P50-P75)' },
    { color: '#22C55E', label: 'Low (<P50)' },
  ];

  const impactLegend = [
    { color: '#EF4444', label: 'Critical (P90+)' },
    { color: '#F97316', label: 'High (P75-P90)' },
    { color: '#EAB308', label: 'Moderate (P50-P75)' },
    { color: '#22C55E', label: 'Low (<P50)' },
  ];

  const legend = mapMode === 'density' ? densityLegend : impactLegend;

  return (
    <div className="map-page">
      <div className="map-container">
        {/* Map Toggle Bar */}
        <div className="map-toggle-bar">
          <button
            id="toggle-density-map"
            className={`map-toggle-btn ${mapMode === 'density' ? 'active' : ''}`}
            onClick={() => setMapMode('density')}
          >
            🔥 Violation Density
          </button>
          <button
            id="toggle-impact-map"
            className={`map-toggle-btn ${mapMode === 'impact' ? 'active' : ''}`}
            onClick={() => setMapMode('impact')}
          >
            ⚡ Operational Impact
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading map data...</p>
          </div>
        ) : error ? (
          <div className="loading-state">
            <p style={{ color: 'var(--risk-critical)' }}>Error: {error}</p>
            <p style={{ fontSize: 12 }}>Make sure the backend is running on port 8000</p>
          </div>
        ) : (
          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <FitBounds markers={markers} />
            {markers.map((marker) => (
              <CircleMarker
                key={marker.zone_id}
                center={[marker.lat, marker.lon]}
                radius={getMarkerRadius(marker)}
                pathOptions={{
                  color: marker.color,
                  fillColor: marker.color,
                  fillOpacity: 0.6,
                  weight: 2,
                  opacity: 0.8,
                }}
                eventHandlers={{
                  click: () => handleMarkerClick(marker.zone_id),
                }}
              >
                <Popup>
                  <div>
                    <div className="popup-title">{marker.zone_name}</div>
                    {mapMode === 'density' ? (
                      <>
                        <div className="popup-stat">
                          <span className="label">Violations</span>
                          <span className="value">{marker.violations?.toLocaleString()}</span>
                        </div>
                        <div className="popup-stat">
                          <span className="label">Density Rank</span>
                          <span className="value">#{marker.density_rank}</span>
                        </div>
                        <div className="popup-stat">
                          <span className="label">Risk Level</span>
                          <span className="value" style={{ color: marker.color }}>{marker.risk}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="popup-stat">
                          <span className="label">Impact Score</span>
                          <span className="value">{marker.impact_score}</span>
                        </div>
                        <div className="popup-stat">
                          <span className="label">Impact Rank</span>
                          <span className="value">#{marker.impact_rank}</span>
                        </div>
                        <div className="popup-stat">
                          <span className="label">Severity</span>
                          <span className="value" style={{ color: marker.color }}>{marker.severity}</span>
                        </div>
                      </>
                    )}
                    <button
                      className="popup-btn"
                      onClick={() => handleMarkerClick(marker.zone_id)}
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="map-legend">
          <h4>{mapMode === 'density' ? 'Violation Density' : 'Impact Score'}</h4>
          {legend.map(({ color, label }) => (
            <div className="legend-item" key={label}>
              <span className="legend-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {zoneDetail && (
        <ZoneDetails
          zone={zoneDetail}
          onClose={() => {
            setSelectedZone(null);
            setZoneDetail(null);
          }}
        />
      )}
    </div>
  );
}
