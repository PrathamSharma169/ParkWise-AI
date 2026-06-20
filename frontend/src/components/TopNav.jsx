import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Map, LayoutDashboard, ListChecks, Info, ChevronDown, LineChart } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import NavDatePicker from "@/components/NavDatePicker";

const NAV = [
  { id: "map", path: ROUTES.map, label: "Live City Map", icon: Map },
  { id: "dashboard", path: ROUTES.dashboard, label: "City Pulse", icon: LayoutDashboard },
  { id: "recommendations", path: ROUTES.recommendations, label: "Action Center", icon: ListChecks },
  { id: "trends", path: ROUTES.trends, label: "Trends", icon: LineChart },
  { id: "about", path: ROUTES.about, label: "About", icon: Info },
];

export default function TopNav({
  showDatePicker = false,
  startDate,
  endDate,
  dateBounds,
  onApplyDates,
  onClearDates,
}) {
  return (
    <nav className="top-nav" data-testid="top-nav">
      <Link
        to={ROUTES.home}
        className="brand-lockup"
        data-testid="brand-home"
        aria-label="Namma Bengaluru home"
      >
        <img
          src={`${process.env.PUBLIC_URL}/logobengaluru.png`}
          alt=""
          className="brand-logo"
          aria-hidden="true"
        />
      </Link>

      <div className="nav-pills" data-testid="nav-pills">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.id}
              to={n.path}
              id={`nav-${n.id}`}
              data-testid={`nav-${n.id}`}
              className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`}
            >
              <Icon size={15} strokeWidth={2} />
              {n.label}
            </NavLink>
          );
        })}
      </div>

      <div className="nav-actions">
        {showDatePicker && (
          <NavDatePicker
            startDate={startDate}
            endDate={endDate}
            minDate={dateBounds?.min}
            maxDate={dateBounds?.max}
            onApply={onApplyDates}
            onClear={onClearDates}
          />
        )}
        <button
          type="button"
          className="nav-profile-btn"
          data-testid="nav-profile"
          aria-label="Open account menu"
        >
          <span className="nav-profile-avatar" aria-hidden="true">
            AK
          </span>
          <span className="nav-profile-meta">
            <span className="nav-profile-name">Ananya K.</span>
            <span className="nav-profile-role">Chief of Staff</span>
          </span>
          <ChevronDown className="nav-profile-chevron" size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
