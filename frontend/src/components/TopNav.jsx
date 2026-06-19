import React from "react";
import { Map, LayoutDashboard, ListChecks, Info } from "lucide-react";
import MultilingualBengaluru from "@/components/MultilingualBengaluru";

const NAV = [
  { id: "map",             label: "Live City Map",   icon: Map },
  { id: "dashboard",       label: "City Pulse",       icon: LayoutDashboard },
  { id: "recommendations", label: "Action Center",    icon: ListChecks },
  { id: "about",           label: "About",            icon: Info },
];

export default function TopNav({ activePage, onNavigate, onHome }) {
  return (
    <nav className="top-nav" data-testid="top-nav">
      <div className="brand-lockup" onClick={onHome} data-testid="brand-home">
        <div className="brand-seal" aria-hidden>ನ</div>
        <div className="brand-text">
          <span className="name">
            Namma{" "}
            <span style={{ color: "var(--primary)" }}>
              <span style={{ display: "inline-block", minWidth: "5.5em" }}>
                <MultilingualBengaluru />
              </span>
            </span>
          </span>
          <span className="dept">Bengaluru City Traffic Police · Intelligence Console</span>
        </div>
      </div>

      <div className="nav-pills" data-testid="nav-pills">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = activePage === n.id;
          return (
            <button
              key={n.id}
              id={`nav-${n.id}`}
              data-testid={`nav-${n.id}`}
              className={`nav-pill ${isActive ? "active" : ""}`}
              onClick={() => onNavigate(n.id)}
            >
              <Icon size={15} strokeWidth={2} />
              {n.label}
            </button>
          );
        })}
      </div>

      <div className="live-chip" data-testid="live-chip">
        <span className="live-dot" />
        Live Feed
      </div>
    </nav>
  );
}
