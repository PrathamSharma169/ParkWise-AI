import React from 'react';
import { X, MapPin, Clock, AlertTriangle, Car } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const VEHICLE_COLORS = {
  CAR: '#3b82f6',
  BIKE: '#22c55e',
  AUTO: '#f97316',
  'MAXI CAB': '#a78bfa',
  BUS: '#ef4444',
  TRUCK: '#ec4899',
  OTHERS: '#64748b',
};

function getSeverityInfo(score) {
  if (score >= 75) return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  if (score >= 50) return { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.15)' };
  if (score >= 25) return { label: 'Moderate', color: '#eab308', bg: 'rgba(234,179,8,0.15)' };
  return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
}

export default function ZoneDetails({ zone, onClose }) {
  if (!zone) return null;

  const severity = getSeverityInfo(zone.impact_score);

  // Prepare vehicle distribution pie data
  const vehicleData = Object.entries(zone.vehicle_distribution || {}).map(([name, value]) => ({
    name,
    value,
    color: VEHICLE_COLORS[name] || '#64748b',
  }));

  // Prepare hourly distribution bar data
  const hourlyData = Object.entries(zone.hourly_distribution || {})
    .map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      count,
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: 'var(--text-primary)',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontWeight: 600 }}>{payload[0].value} violations</div>
      </div>
    );
  };

  return (
    <div className="detail-panel" id="zone-detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="zone-name">{zone.zone_name}</div>
            <div className="zone-meta">
              <MapPin size={14} />
              {zone.police_station || 'Unknown Station'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Close details panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Impact Score */}
      <div className="detail-section">
        <h3>Impact Score</h3>
        <div className="score-display">
          <div
            className="score-circle"
            style={{
              color: severity.color,
              background: severity.bg,
              '--score-pct': zone.impact_score,
            }}
          >
            {Math.round(zone.impact_score)}
          </div>
          <div className="score-meta">
            <div className="label">City Ranking</div>
            <div className="rank">
              Impact: #{zone.impact_rank} · Density: #{zone.density_rank}
            </div>
            <span
              className="severity"
              style={{ background: severity.bg, color: severity.color }}
            >
              {severity.label}
            </span>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-label">Violations</div>
            <div className="stat-value">{zone.total_violations?.toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Junction %</div>
            <div className="stat-value">{((zone.junction_ratio || 0) * 100).toFixed(0)}%</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Avg Resolution</div>
            <div className="stat-value">
              {(zone.avg_resolution_time || 0) > 24
                ? `${(zone.avg_resolution_time / 24).toFixed(1)}d`
                : `${(zone.avg_resolution_time || 0).toFixed(1)}h`
              }
            </div>
            <div className="stat-sub">
              {zone.avg_resolution_time > 48 ? '⚠ Slow' : '✓ Normal'}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Percentile</div>
            <div className="stat-value">{zone.violation_percentile}</div>
          </div>
        </div>
      </div>

      {/* Top Affected Roads */}
      {zone.top_locations && zone.top_locations.length > 0 && (
        <div className="detail-section">
          <h3>Top Affected Roads</h3>
          <div className="road-list">
            {zone.top_locations.slice(0, 5).map((loc, i) => (
              <div className="road-item" key={i}>
                <span className="road-name">
                  {i + 1}. {loc.name}
                </span>
                <span className="road-count">{loc.count} violations</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Distribution */}
      {vehicleData.length > 0 && (
        <div className="detail-section">
          <h3>Vehicle Distribution</h3>
          <div className="chart-container" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  stroke="none"
                >
                  {vehicleData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                      }}>
                        <div style={{ fontWeight: 600, color: payload[0].payload.color }}>
                          {payload[0].name}
                        </div>
                        <div style={{ color: 'var(--text-primary)' }}>
                          {payload[0].value} vehicles
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend below pie chart */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 8 }}>
            {vehicleData.map((v) => (
              <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: v.color, flexShrink: 0,
                }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {v.name} ({v.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Pattern */}
      {hourlyData.length > 0 && (
        <div className="detail-section">
          <h3>Hourly Violation Pattern</h3>
          <div className="chart-container" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={3}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {zone.recommendations && zone.recommendations.length > 0 && (
        <div className="detail-section">
          <h3>Recommendations</h3>
          {zone.recommendations.map((rec, i) => (
            <div className="rec-card" key={i}>
              <div className="rec-header">
                <span className="rec-action">{rec.action}</span>
                <span className={`rec-priority priority-${rec.priority.toLowerCase()}`}>
                  {rec.priority}
                </span>
              </div>
              <div className="rec-reason">{rec.reason}</div>
              {rec.expected_benefit && (
                <div className="rec-benefit">
                  ✓ {rec.expected_benefit}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
