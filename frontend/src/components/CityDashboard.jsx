import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../utils/api';
import {
  MapPin, AlertTriangle, TrendingUp, BarChart3, Eye, Shield, Building2, Car
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

function getSeverityColor(score) {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 25) return '#eab308';
  return '#22c55e';
}

const VEHICLE_COLORS = {
  CAR: '#3b82f6',
  BIKE: '#22c55e',
  AUTO: '#f97316',
  'MAXI CAB': '#a78bfa',
  BUS: '#ef4444',
  TRUCK: '#ec4899',
  OTHERS: '#64748b',
};

export default function CityDashboard({ startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getAnalytics(startDate, endDate);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading city analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-state">
        <p style={{ color: 'var(--risk-critical)' }}>Error: {error}</p>
        <p style={{ fontSize: 12 }}>Make sure the backend is running</p>
      </div>
    );
  }

  if (!data) return null;

  const severityData = [
    { name: 'Critical', value: data.severity_distribution?.critical || 0, color: '#ef4444' },
    { name: 'High', value: data.severity_distribution?.high || 0, color: '#f97316' },
    { name: 'Moderate', value: data.severity_distribution?.moderate || 0, color: '#eab308' },
    { name: 'Low', value: data.severity_distribution?.low || 0, color: '#22c55e' },
  ];

  const vehicleData = Object.entries(data.vehicle_distribution || {}).map(([name, value]) => ({
    name,
    value,
    color: VEHICLE_COLORS[name] || '#64748b',
  })).sort((a, b) => b.value - a.value);

  const policeStationData = (data.police_stations || []).slice(0, 8).map(s => ({
    name: s.station.length > 15 ? s.station.substring(0, 15) + '...' : s.station,
    fullName: s.station,
    zones: s.zones,
  }));

  return (
    <div className="dashboard-page">
      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <MapPin size={18} />
          </div>
          <div className="kpi-value">{data.total_zones}</div>
          <div className="kpi-label">Risk Zones Identified</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <AlertTriangle size={18} />
          </div>
          <div className="kpi-value">{data.total_violations?.toLocaleString()}</div>
          <div className="kpi-label">Total Violations</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
            <TrendingUp size={18} />
          </div>
          <div className="kpi-value">{data.avg_impact_score}</div>
          <div className="kpi-label">Avg Impact Score</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
            <Eye size={18} />
          </div>
          <div className="kpi-value">{(data.overlooked_zones || []).length}</div>
          <div className="kpi-label">Hidden Hotspots</div>
        </div>
      </div>

      {/* Main Content Columns */}
      <div className="dashboard-columns">
        {/* Top 10 High Impact Zones */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🔥 Top 10 High Impact Zones</h3>
          </div>
          <div className="card-body">
            <div className="zone-rank-list">
              {(data.top_impact_zones || []).map((zone, i) => (
                <div className="zone-rank-item" key={zone.zone_id}>
                  <div
                    className="zone-rank-number"
                    style={{
                      background: `${getSeverityColor(zone.impact_score)}20`,
                      color: getSeverityColor(zone.impact_score),
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div className="zone-rank-info">
                    <div className="name">{zone.zone_name}</div>
                    <div className="meta">Impact Rank #{zone.impact_rank}</div>
                  </div>
                  <div
                    className="zone-rank-score"
                    style={{ color: getSeverityColor(zone.impact_score) }}
                  >
                    {zone.impact_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 10 High Density Zones */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>📊 Top 10 High Density Zones</h3>
          </div>
          <div className="card-body">
            <div className="zone-rank-list">
              {(data.top_density_zones || []).map((zone, i) => (
                <div className="zone-rank-item" key={zone.zone_id}>
                  <div
                    className="zone-rank-number"
                    style={{
                      background: 'rgba(59,130,246,0.15)',
                      color: '#3b82f6',
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div className="zone-rank-info">
                    <div className="name">{zone.zone_name}</div>
                    <div className="meta">Density Rank #{zone.density_rank}</div>
                  </div>
                  <div className="zone-rank-score" style={{ color: '#3b82f6' }}>
                    {zone.total_violations?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Overlooked Zones */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🔍 Most Overlooked Zones</h3>
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'rgba(239,68,68,0.1)',
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              High Impact, Low Density
            </span>
          </div>
          <div className="card-body">
            {(data.overlooked_zones || []).length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No overlooked zones detected</p>
              </div>
            ) : (
              <div className="zone-rank-list">
                {(data.overlooked_zones || []).map((zone, i) => (
                  <div className="zone-rank-item" key={zone.zone_id}>
                    <div
                      className="zone-rank-number"
                      style={{
                        background: 'rgba(234,179,8,0.15)',
                        color: '#eab308',
                      }}
                    >
                      ⚠
                    </div>
                    <div className="zone-rank-info">
                      <div className="name">{zone.zone_name}</div>
                      <div className="meta">
                        Impact #{zone.impact_rank} · Density #{zone.density_rank}
                      </div>
                    </div>
                    <div
                      className="zone-rank-score"
                      style={{ color: getSeverityColor(zone.impact_score) }}
                    >
                      {zone.impact_score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🎯 Severity Distribution</h3>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
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
                            {payload[0].value} zones
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {severityData.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: s.color, flexShrink: 0,
                  }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {s.name} ({s.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vehicle Distribution */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🚗 City-wide Vehicle Distribution</h3>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehicleData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    width={70}
                  />
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
                            {payload[0].payload.name}
                          </div>
                          <div style={{ color: 'var(--text-primary)' }}>
                            {payload[0].value?.toLocaleString()} violations
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                  >
                    {vehicleData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Police Station Analytics */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🏛️ Police Station Analytics</h3>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={policeStationData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
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
                          <div style={{ fontWeight: 600, color: '#818cf8' }}>
                            {payload[0].payload.fullName}
                          </div>
                          <div style={{ color: 'var(--text-primary)' }}>
                            {payload[0].value} hotspot zones
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="zones" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
