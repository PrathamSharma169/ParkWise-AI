import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import CityDashboard from './components/CityDashboard';
import RecommendationPanel from './components/RecommendationPanel';
import DateSelector from './components/DateSelector';
import { getHotspots } from './utils/api';
import { MapPin, BarChart3, Shield } from 'lucide-react';

function AboutPage() {
  return (
    <div className="dashboard-page" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          ParkWise AI
        </h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 16,
          lineHeight: 1.6,
        }}>
          Parking Enforcement Intelligence Platform
        </p>
      </div>

      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>🎯 Problem Statement</h3>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
            Parking violations are one of the major contributors to urban traffic disruption.
            Current systems focus only on detecting violations after they occur. Our solution
            identifies parking risk zones across Bengaluru using historical parking violation data,
            prioritizes them based on operational impact, and recommends targeted enforcement actions.
          </p>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>💡 Our Innovation: Dual Intelligence Maps</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: 16,
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#3b82f6' }}>
                🔥 Map 1: Violation Density Map
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                Shows <strong style={{ color: 'var(--text-primary)' }}>where</strong> parking violations
                occur most frequently. Colored by violation count percentiles (P25/P50/P75/P90).
              </p>
            </div>
            <div style={{
              padding: 16,
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#f97316' }}>
                ⚡ Map 2: Operational Impact Map
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                Shows <strong style={{ color: 'var(--text-primary)' }}>which</strong> zones authorities
                should prioritize first. Uses a composite Impact Score (0-100) based on violation density (45%),
                vehicle impact (25%), junction proximity (15%), and enforcement difficulty (15%).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>🔑 Key Insight</h3>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14, marginBottom: 12 }}>
            By comparing both maps, the platform identifies <strong style={{ color: '#eab308' }}>hidden hotspots</strong> —
            zones with low violation frequency but high operational disruption. These are the zones
            most likely to be overlooked by conventional systems.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
          }}>
            <div style={{
              padding: 12,
              background: 'rgba(239,68,68,0.1)',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.2)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>
                High + High
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Major city priority
              </div>
            </div>
            <div style={{
              padding: 12,
              background: 'rgba(234,179,8,0.1)',
              borderRadius: 8,
              border: '1px solid rgba(234,179,8,0.2)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: '#eab308', fontWeight: 600, marginBottom: 4 }}>
                Low Density + High Impact
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Hidden hotspot
              </div>
            </div>
            <div style={{
              padding: 12,
              background: 'rgba(34,197,94,0.1)',
              borderRadius: 8,
              border: '1px solid rgba(34,197,94,0.2)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>
                High Density + Low Impact
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Lower operational risk
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3>🛠️ Technology Stack</h3>
        </div>
        <div className="card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            {[
              { label: 'Backend', value: 'Python + FastAPI' },
              { label: 'Clustering', value: 'DBSCAN (scikit-learn)' },
              { label: 'Frontend', value: 'React + Vite' },
              { label: 'Maps', value: 'Leaflet + OpenStreetMap' },
              { label: 'Charts', value: 'Recharts' },
              { label: 'Database', value: 'PostgreSQL / SQLite' },
            ].map(item => (
              <div key={item.label} style={{
                padding: 12,
                background: 'var(--bg-elevated)',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('map');
  const [headerInfo, setHeaderInfo] = useState({ zones: 0, violations: 0 });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Try to load basic stats for the header
  useEffect(() => {
    async function loadHeaderStats() {
      try {
        const data = await getHotspots(startDate, endDate);
        setHeaderInfo({
          zones: data.length,
          violations: data.reduce((sum, h) => sum + (h.total_violations || 0), 0),
        });
      } catch (e) {
        // Backend not available yet
      }
    }
    loadHeaderStats();
  }, [startDate, endDate]);

  const pageTitles = {
    map: 'Parking Risk Maps',
    dashboard: 'City Intelligence Dashboard',
    recommendations: 'Recommendation Center',
    about: 'About ParkWise AI',
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>{pageTitles[activePage]}</h1>
            <span className="badge">Bengaluru</span>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <MapPin size={14} />
              <span className="value">{headerInfo.zones}</span>
              <span>Risk Zones</span>
            </div>
            <div className="header-stat">
              <BarChart3 size={14} />
              <span className="value">{headerInfo.violations.toLocaleString()}</span>
              <span>Violations</span>
            </div>
          </div>
        </header>

        {/* Date Selector */}
        <DateSelector onFilterChange={(start, end) => { setStartDate(start); setEndDate(end); }} />

        {/* Page Content */}
        <div className="page-content">
          {activePage === 'map' && <MapView startDate={startDate} endDate={endDate} />}
          {activePage === 'dashboard' && <CityDashboard startDate={startDate} endDate={endDate} />}
          {activePage === 'recommendations' && <RecommendationPanel startDate={startDate} endDate={endDate} />}
          {activePage === 'about' && <AboutPage />}
        </div>
      </div>
    </div>
  );
}
