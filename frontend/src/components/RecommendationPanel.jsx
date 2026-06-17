import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../utils/api';
import { Shield, AlertTriangle, Eye, Wrench } from 'lucide-react';

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

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

  // Flatten and filter recommendations
  let allRecs = data.all || [];
  if (activeFilter !== 'All') {
    allRecs = allRecs.filter(r => r.priority === activeFilter);
  }

  // Add zone name from by_priority data
  const recsWithZones = allRecs.map(rec => {
    // Find zone name from the grouped data
    for (const priority of PRIORITY_ORDER) {
      const found = (data.by_priority[priority] || []).find(
        r => r.zone_id === rec.zone_id && r.action === rec.action
      );
      if (found) return { ...rec, zone_name: found.zone_name };
    }
    return rec;
  });

  // Count by priority
  const counts = {
    All: data.total || 0,
    Critical: (data.by_priority?.Critical || []).length,
    High: (data.by_priority?.High || []).length,
    Medium: (data.by_priority?.Medium || []).length,
    Low: (data.by_priority?.Low || []).length,
  };

  const categoryIcons = {
    Towing: '🚛',
    Deployment: '👮',
    Enforcement: '⚡',
    Infrastructure: '🏗️',
    Strategic: '🎯',
    Patrol: '🔄',
    Monitoring: '👁️',
  };

  return (
    <div className="rec-page">
      <div className="rec-page-header">
        <h2>Recommendation Center</h2>
        <p>AI-generated enforcement recommendations based on zone analytics</p>
      </div>

      {/* Summary Stats */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <AlertTriangle size={18} />
          </div>
          <div className="kpi-value">{counts.Critical}</div>
          <div className="kpi-label">Critical Actions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
            <Shield size={18} />
          </div>
          <div className="kpi-value">{counts.High}</div>
          <div className="kpi-label">High Priority</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
            <Eye size={18} />
          </div>
          <div className="kpi-value">{counts.Medium}</div>
          <div className="kpi-label">Medium Priority</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
            <Wrench size={18} />
          </div>
          <div className="kpi-value">{counts.Low}</div>
          <div className="kpi-label">Low Priority</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rec-filters">
        {['All', ...PRIORITY_ORDER].map(filter => (
          <button
            key={filter}
            className={`rec-filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
            id={`filter-${filter.toLowerCase()}`}
          >
            {filter} ({counts[filter] || 0})
          </button>
        ))}
      </div>

      {/* Recommendation Cards */}
      <div className="rec-list">
        {recsWithZones.map((rec, i) => (
          <div className="rec-card" key={i}>
            <div className="rec-header">
              <span className="rec-action">
                {categoryIcons[rec.category] || '📋'} {rec.action}
              </span>
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
            {rec.zone_name && (
              <div className="rec-zone">
                📍 {rec.zone_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {recsWithZones.length === 0 && (
        <div className="empty-state">
          <p>No recommendations found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}
