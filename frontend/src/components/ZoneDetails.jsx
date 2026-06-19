import React, { useState } from 'react';
import { X, MapPin, Clock, AlertTriangle, Car, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { explainZoneRisk } from '../utils/api';

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

export default function ZoneDetails({ zone, onClose, startDate, endDate }) {
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!zone) return null;

  const severity = getSeverityInfo(zone.impact_score);

  async function handleExplain() {
    if (explanation) {
      setShowExplanation(!showExplanation);
      return;
    }
    setExplaining(true);
    setShowExplanation(true);
    try {
      const result = await explainZoneRisk(zone.zone_id, startDate, endDate);
      setExplanation(result);
    } catch (err) {
      console.error('Explain error:', err);
    } finally {
      setExplaining(false);
    }
  }

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
      {/* Zone Classification & Recommendations */}
      <div className="detail-section">
        <h3>Intelligence</h3>

        {/* Classification badge */}
        {zone.zone_classification && (
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            background: zone.zone_classification === 'Critical Zone' ? 'rgba(239,68,68,0.12)' :
                         zone.zone_classification === 'Hidden Risk Zone' ? 'rgba(234,179,8,0.12)' :
                         zone.zone_classification === 'Frequent Violation Zone' ? 'rgba(249,115,22,0.12)' :
                         zone.zone_classification === 'Stable Zone' ? 'rgba(34,197,94,0.12)' :
                         'rgba(59,130,246,0.12)',
            color: zone.zone_classification === 'Critical Zone' ? '#ef4444' :
                   zone.zone_classification === 'Hidden Risk Zone' ? '#eab308' :
                   zone.zone_classification === 'Frequent Violation Zone' ? '#f97316' :
                   zone.zone_classification === 'Stable Zone' ? '#22c55e' :
                   '#3b82f6',
          }}>
            {zone.zone_classification}
          </div>
        )}

        {/* Rule-engine recommendations */}
        {zone.recommendations && zone.recommendations.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {zone.recommendations.map((rec, i) => {
              const text = typeof rec === 'string' ? rec : rec.action;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)',
                }}>
                  <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                  {text}
                </div>
              );
            })}
          </div>
        )}

        {/* Explain Risk button */}
        <button
          onClick={handleExplain}
          disabled={explaining}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa', fontSize: 13, fontWeight: 600,
            cursor: explaining ? 'wait' : 'pointer',
            width: '100%', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {explaining ? (
            <><Loader2 size={14} className="spin-icon" /> Generating...</>
          ) : explanation ? (
            <><Sparkles size={14} /> {showExplanation ? 'Hide' : 'Show'} AI Explanation</>
          ) : (
            <><Sparkles size={14} /> Explain Risk</>
          )}
        </button>

        {/* AI Explanation */}
        {showExplanation && explanation && (
          <div style={{
            marginTop: 12, padding: 14, borderRadius: 10,
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 8 }}>
              <Sparkles size={12} style={{ marginRight: 4 }} />
              AI Risk Summary
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 10px 0' }}>
              {explanation.risk_summary}
            </p>

            {explanation.key_risk_factors?.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                  Key Risk Factors
                </div>
                <ul style={{ margin: '0 0 10px 0', paddingLeft: 16 }}>
                  {explanation.key_risk_factors.map((f, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f}</li>
                  ))}
                </ul>
              </>
            )}

            {zone.recommendations && zone.recommendations.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                  Recommended Actions
                </div>
                <div style={{ margin: '0 0 10px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {zone.recommendations.map((rec, i) => {
                    const text = typeof rec === 'string' ? rec : rec.action;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 12, color: 'var(--text-secondary)',
                      }}>
                        <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                        {text}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {explanation.recommendation_explanation && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                  Recommendation Explanation
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                  {explanation.recommendation_explanation}
                </p>
              </>
            )}

            <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
              Expected Benefit
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {explanation.expected_benefit}
            </p>

            <div style={{
              marginTop: 10, fontSize: 10, color: 'rgba(167,139,250,0.6)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Sparkles size={10} /> Powered by Gemini 2.5 Flash
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
