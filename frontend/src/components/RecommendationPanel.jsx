import React, { useEffect, useState } from 'react';
import { getRecommendations, explainZoneRisk } from '../utils/api';
import {
  Shield, AlertTriangle, Eye, Wrench, ChevronDown, ChevronUp,
  Sparkles, Loader2, MapPin, TrendingUp, Hash
} from 'lucide-react';

const CLASSIFICATION_CONFIG = {
  'Critical Zone': {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    icon: '🔴',
    description: 'Frequent violations + severe disruption',
  },
  'Frequent Violation Zone': {
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.3)',
    icon: '🟠',
    description: 'Many violations, lower operational impact',
  },
  'Hidden Risk Zone': {
    color: '#eab308',
    bg: 'rgba(234,179,8,0.12)',
    border: 'rgba(234,179,8,0.3)',
    icon: '🟡',
    description: 'Few violations but high disruption — often overlooked',
  },
  'Moderate Zone': {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    icon: '🔵',
    description: 'Moderate risk, periodic monitoring needed',
  },
  'Stable Zone': {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
    icon: '🟢',
    description: 'Low priority, routine monitoring',
  },
};

function ZoneRecCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState(null);

  const cls = rec.zone_classification || 'Moderate Zone';
  const config = CLASSIFICATION_CONFIG[cls] || CLASSIFICATION_CONFIG['Moderate Zone'];

  async function handleExplain() {
    if (explanation) {
      setExpanded(!expanded);
      return;
    }

    setExplaining(true);
    setExplainError(null);
    setExpanded(true);

    try {
      const result = await explainZoneRisk(rec.zone_id);
      setExplanation(result);
    } catch (err) {
      setExplainError(err.message);
    } finally {
      setExplaining(false);
    }
  }

  return (
    <div className="zone-rec-card" style={{ borderLeft: `3px solid ${config.color}` }}>
      {/* Header */}
      <div className="zone-rec-header">
        <div className="zone-rec-title-row">
          <div className="zone-rec-name">
            <MapPin size={14} style={{ color: config.color, flexShrink: 0 }} />
            {rec.zone_name}
          </div>
          <span
            className="classification-badge"
            style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
          >
            {config.icon} {cls}
          </span>
        </div>

        {/* Rank stats */}
        <div className="zone-rec-stats">
          <div className="zone-rec-stat">
            <Hash size={12} />
            <span>Density Rank</span>
            <strong>#{rec.density_rank}</strong>
          </div>
          <div className="zone-rec-stat">
            <TrendingUp size={12} />
            <span>Impact Rank</span>
            <strong>#{rec.impact_rank}</strong>
          </div>
          <div className="zone-rec-stat">
            <AlertTriangle size={12} />
            <span>Impact Score</span>
            <strong>{rec.impact_score?.toFixed?.(1) ?? rec.impact_score}</strong>
          </div>
          <div className="zone-rec-stat">
            <Eye size={12} />
            <span>Violations</span>
            <strong>{rec.total_violations?.toLocaleString?.() ?? rec.total_violations}</strong>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="zone-rec-actions">
        <div className="zone-rec-actions-label">Rule Engine Recommendations</div>
        {(rec.recommendations || []).map((r, i) => (
          <div className="zone-rec-action-item" key={i}>
            <span className="zone-rec-check">✓</span>
            {r}
          </div>
        ))}
      </div>

      {/* Explain Risk Button */}
      <button
        className="explain-risk-btn"
        onClick={handleExplain}
        disabled={explaining}
      >
        {explaining ? (
          <>
            <Loader2 size={14} className="spin-icon" />
            Generating AI Explanation...
          </>
        ) : explanation ? (
          <>
            <Sparkles size={14} />
            {expanded ? 'Hide AI Explanation' : 'Show AI Explanation'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Explain Risk
          </>
        )}
      </button>

      {/* AI Explanation */}
      {expanded && (
        <div className="ai-explanation">
          {explaining && (
            <div className="ai-loading">
              <Loader2 size={20} className="spin-icon" />
              <span>Gemini 2.5 Flash is analyzing this zone...</span>
            </div>
          )}

          {explainError && (
            <div className="ai-error">
              ⚠ {explainError}
            </div>
          )}

          {explanation && (
            <>
              <div className="ai-section">
                <div className="ai-section-title">
                  <Sparkles size={13} /> Risk Summary
                </div>
                <p>{explanation.risk_summary}</p>
              </div>

              {explanation.key_risk_factors?.length > 0 && (
                <div className="ai-section">
                  <div className="ai-section-title">Key Risk Factors</div>
                  <ul className="ai-factors">
                    {explanation.key_risk_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(rec.recommendations || []).length > 0 && (
                <div className="ai-section">
                  <div className="ai-section-title">Recommended Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {rec.recommendations.map((r, i) => (
                      <div key={i} className="zone-rec-action-item">
                        <span className="zone-rec-check">✓</span>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ai-section">
                <div className="ai-section-title">Recommendation Explanation</div>
                <p>{explanation.recommendation_explanation}</p>
              </div>

              <div className="ai-section">
                <div className="ai-section-title">Expected Benefit</div>
                <p>{explanation.expected_benefit}</p>
              </div>

              <div className="ai-powered-tag">
                <Sparkles size={11} /> Powered by Gemini 2.5 Flash
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const res = await getRecommendations();
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-state">
        <p style={{ color: 'var(--risk-critical)' }}>Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  // Filter by classification
  let filteredRecs = data.all || [];
  if (activeFilter !== 'All') {
    filteredRecs = filteredRecs.filter(r => r.zone_classification === activeFilter);
  }

  // Sort: Critical first, then by impact score descending
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  filteredRecs = [...filteredRecs].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 4;
    const pb = priorityOrder[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    return (b.impact_score || 0) - (a.impact_score || 0);
  });

  const counts = data.classification_counts || {};
  const totalZones = data.total || 0;

  // Classification filter buttons
  const classifications = [
    'All',
    'Critical Zone',
    'Hidden Risk Zone',
    'Frequent Violation Zone',
    'Moderate Zone',
    'Stable Zone',
  ];

  return (
    <div className="rec-page">
      <div className="rec-page-header">
        <h2>Recommendation Center</h2>
        <p>Zone classifications and rule-engine recommendations with AI-powered explanations</p>
      </div>

      {/* Classification summary cards */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        {Object.entries(CLASSIFICATION_CONFIG).map(([cls, config]) => (
          <div
            className="kpi-card"
            key={cls}
            style={{ cursor: 'pointer', borderColor: activeFilter === cls ? config.color : undefined }}
            onClick={() => setActiveFilter(activeFilter === cls ? 'All' : cls)}
          >
            <div className="kpi-icon" style={{ background: config.bg, color: config.color }}>
              <span style={{ fontSize: 18 }}>{config.icon}</span>
            </div>
            <div className="kpi-value">{counts[cls] || 0}</div>
            <div className="kpi-label">{cls.replace(' Zone', '')}</div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div className="rec-filters">
        {classifications.map(cls => {
          const config = CLASSIFICATION_CONFIG[cls];
          const count = cls === 'All' ? totalZones : (counts[cls] || 0);
          return (
            <button
              key={cls}
              className={`rec-filter-btn ${activeFilter === cls ? 'active' : ''}`}
              onClick={() => setActiveFilter(cls)}
              style={activeFilter === cls && config ? { borderColor: config.color, color: config.color } : {}}
            >
              {config ? config.icon : '📋'} {cls.replace(' Zone', '')} ({count})
            </button>
          );
        })}
      </div>

      {/* Zone recommendation cards */}
      <div className="rec-list">
        {filteredRecs.map((rec) => (
          <ZoneRecCard key={rec.zone_id} rec={rec} />
        ))}
      </div>

      {filteredRecs.length === 0 && (
        <div className="empty-state">
          <p>No zones found for the selected classification.</p>
        </div>
      )}
    </div>
  );
}
