import React from 'react';
import { Map, BarChart3, Shield, LayoutDashboard, Info, LineChart } from 'lucide-react';

const navItems = [
  { id: 'map', icon: Map, label: 'Maps' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'recommendations', icon: Shield, label: 'Recommendations' },
  { id: 'trends', icon: LineChart, label: 'Trends' },
  { id: 'about', icon: Info, label: 'About' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <nav className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-logo" title="ParkWise AI">
        P
      </div>
      <div className="sidebar-nav">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`sidebar-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-label={label}
            aria-current={activePage === id ? 'page' : undefined}
          >
            <Icon size={20} />
            <span className="sidebar-tooltip">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
