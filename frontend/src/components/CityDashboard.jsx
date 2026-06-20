import React, { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, CartesianGrid,
} from "recharts";
import {
  Activity, MapPin, TrendingUp, EyeOff, Sun, Moon, Building2,
} from "lucide-react";
import Odometer from "@/components/Odometer";
import { getAnalytics, getHotspots } from "@/utils/api";

const SEVERITY_PALETTE = {
  critical: "#D90429",
  high:     "#EF8354",
  moderate: "#E9C46A",
  low:      "#2D6A4F",
};

function WaffleChart({ distribution }) {
  const total = (distribution.critical || 0) + (distribution.high || 0)
              + (distribution.moderate || 0) + (distribution.low || 0);
  const cells = [];

  // Build 100 cells proportional to severity
  ["critical", "high", "moderate", "low"].forEach((sev) => {
    const count = Math.round(((distribution[sev] || 0) / total) * 100);
    for (let i = 0; i < count; i++) cells.push(sev);
  });
  while (cells.length < 100) cells.push("low");
  cells.length = 100;

  return (
    <div data-testid="severity-waffle">
      <div className="waffle">
        {cells.map((sev, i) => (
          <div
            key={i}
            className={`waffle-cell ${sev}`}
            style={{ animationDelay: `${i * 6}ms` }}
            title={`${sev} zone`}
          />
        ))}
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { sev: "critical", label: "Critical",  hint: "Immediate dispatch" },
          { sev: "high",     label: "High",      hint: "Priority patrol" },
          { sev: "moderate", label: "Moderate",  hint: "Scheduled review" },
          { sev: "low",      label: "Low",       hint: "Routine monitoring" },
        ].map((s) => (
          <div key={s.sev} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2,
              background: SEVERITY_PALETTE[s.sev],
            }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", width: 78 }}>
              {s.label}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11.5,
              color: "var(--text-secondary)", letterSpacing: "0.04em",
            }}>
              {distribution[s.sev] || 0} {distribution[s.sev] === 1 ? "zone" : "zones"} · {s.hint}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DangerList({ rows, valueKey, valueLabel, max }) {
  const ceiling = Math.max(...rows.map((r) => r[valueKey]), max || 1);
  return (
    <div className="stagger" data-testid={`danger-list-${valueKey}`}>
      {rows.map((row, i) => {
        const pct = (row[valueKey] / ceiling) * 100;
        return (
          <div className="danger-row" key={`${valueKey}-${row.zone_id ?? i}`}>
            <div className={`danger-rank ${i < 3 ? "top-3" : ""}`}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div>
              <div className="danger-name">{row.zone_name}</div>
              <div className="danger-bar-track">
                <div
                  className="danger-bar-fill"
                  style={{ width: `${pct}%`, animationDelay: `${i * 40}ms` }}
                />
              </div>
            </div>
            <div className="danger-value">
              {valueKey === "impact_score" ? row.impact_score.toFixed(1) : row[valueKey].toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrafficWave({ data }) {
  return (
    <div data-testid="hourly-wave" style={{ width: "100%", height: 220, marginTop: 12 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#D90429" stopOpacity={0.35} />
              <stop offset="60%" stopColor="#E9C46A" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#2D6A4F" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D0" vertical={false} />
          <XAxis dataKey="hourLabel" tick={{ fontSize: 11, fill: "#8C9298", fontFamily: "var(--font-mono)" }}
                 axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fontSize: 11, fill: "#8C9298" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#fff", border: "1px solid #E5E0D0",
              borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)",
            }}
            labelStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#4A4D50" }}
          />
          <Area
            type="monotone" dataKey="violations"
            stroke="#D90429" strokeWidth={2.5}
            fill="url(#waveGrad)"
            activeDot={{ r: 5, fill: "#D90429", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PoliceStationBar({ data }) {
  const rows = (data || []).slice(0, 8);
  return (
    <div data-testid="police-station-bar" style={{ width: "100%", height: 280, marginTop: 12 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#E5E0D0" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#8C9298" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="station" width={150}
                 tick={{ fontSize: 11.5, fill: "#1A1D20", fontFamily: "var(--font-body)" }}
                 axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(27,67,50,0.06)" }}
            contentStyle={{ background: "#fff", border: "1px solid #E5E0D0", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="zones" fill="#1B4332" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CityDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [hotspots, setHotspots] = useState([]);

  useEffect(() => {
    Promise.all([getAnalytics(), getHotspots()])
      .then(([a, h]) => { setAnalytics(a); setHotspots(h); })
      .catch(() => {});
  }, []);

  // Aggregated hourly data
  const hourlyWaveData = useMemo(() => {
    if (!hotspots.length) return [];
    const sums = Array(24).fill(0);
    hotspots.forEach((h) => {
      Object.entries(h.hourly_distribution || {}).forEach(([hr, v]) => {
        sums[Number(hr)] += Number(v) || 0;
      });
    });
    return sums.map((v, h) => ({
      hour: h,
      hourLabel: `${String(h).padStart(2, "0")}:00`,
      violations: v,
    }));
  }, [hotspots]);

  const peakHour = useMemo(() => {
    if (!hourlyWaveData.length) return null;
    return hourlyWaveData.reduce((m, c) => c.violations > m.violations ? c : m, hourlyWaveData[0]);
  }, [hourlyWaveData]);

  const policeData = useMemo(() => {
    if (!analytics?.police_stations) return [];
    return analytics.police_stations.map((s) => ({
      station: s.station || s.name || "—",
      zones: s.zones || s.violations || s.count || 0,
    }));
  }, [analytics]);

  if (!analytics) {
    return (
      <div className="page-shell" data-testid="dashboard-loading">
        <p style={{ color: "var(--text-muted)" }}>Loading city pulse…</p>
      </div>
    );
  }

  const sev = analytics.severity_distribution || {};

  return (
    <div className="page-shell" data-testid="dashboard-page">
      <div className="section-head">
        <div>
          {/* <div className="overline">◉ City Pulse · Live across {analytics.total_zones} Zones</div> */}
          <h2 style={{ fontSize: 28, marginTop: 8 }}>How Bengaluru is breathing today.</h2>
          <p>A consolidated read-out of the city's parking-pressure footprint, ranked &amp; visualised.</p>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16, marginBottom: 28,
      }} className="stagger" data-testid="kpi-grid">
        {[
          {
            label: "Risk Zones",
            value: analytics.total_zones,
            sub: "Clustered hotspots",
            icon: MapPin,
            color: "var(--primary)",
            tint: "var(--primary-tint)",
          },
          {
            label: "Total Violations",
            value: analytics.total_violations,
            sub: "Mapped across the city",
            icon: Activity,
            color: "var(--signal-red)",
            tint: "var(--signal-red-tint)",
          },
          {
            label: "Avg Impact Score",
            value: Number((analytics.avg_impact_score || 0).toFixed(1)),
            sub: "Composite score / 100",
            icon: TrendingUp,
            color: "var(--auto-yellow-deep)",
            tint: "var(--auto-yellow-tint)",
            decimals: 1,
          },
          {
            label: "Hidden Hotspots",
            value: (analytics.overlooked_zones || []).length,
            sub: "Low density, high impact",
            icon: EyeOff,
            color: "var(--primary-light)",
            tint: "var(--primary-tint)",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card card-pad" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span className="overline">{kpi.label}</span>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: kpi.tint, color: kpi.color,
                  display: "grid", placeItems: "center",
                }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: 40, color: kpi.color, lineHeight: 1.05 }}>
                <Odometer value={kpi.value} duration={1600} decimals={kpi.decimals || 0} />
              </div>
              <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--text-muted)" }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Impact + Top Density */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 16, marginBottom: 28,
      }}>
        <div className="card" data-testid="top-impact-list">
          <div className="hazard-stripe" />
          <div className="card-pad">
            <div className="section-head" style={{ marginBottom: 4 }}>
              <div>
                <div className="overline overline-red">◉ Priority Watchlist</div>
                <h3 style={{ fontSize: 18, marginTop: 6 }}>Top 10 · Operational Impact</h3>
                <p>Highest composite-score zones to deploy first.</p>
              </div>
            </div>
            <DangerList
              rows={(analytics.top_impact_zones || []).slice(0, 10)}
              valueKey="impact_score"
            />
          </div>
        </div>

        <div className="card" data-testid="top-density-list">
          <div className="card-pad">
            <div className="section-head" style={{ marginBottom: 4 }}>
              <div>
                <div className="overline">◉ Density Leaders</div>
                <h3 style={{ fontSize: 18, marginTop: 6 }}>Top 10 · Violation Volume</h3>
                <p>Highest raw violation counts — the city's loudest zones.</p>
              </div>
            </div>
            <DangerList
              rows={(analytics.top_density_zones || []).slice(0, 10)}
              valueKey="total_violations"
            />
          </div>
        </div>
      </div>

      {/* Waffle + Wave */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(320px, 1fr) minmax(420px, 2fr)",
        gap: 16, marginBottom: 28,
      }} className="dashboard-row-2">
        <div className="card card-pad" data-testid="severity-distribution">
          <div className="overline" style={{ marginBottom: 6 }}>◉ City Risk Distribution</div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Severity Mix</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginBottom: 20 }}>
            Every square = 1% of the city's risk footprint.
          </p>
          <WaffleChart distribution={sev} />
        </div>

        <div className="card card-pad" data-testid="hourly-wave-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="overline">◉ City Rhythm · 24-hour</div>
              <h3 style={{ fontSize: 18, marginTop: 6 }}>The Traffic Wave</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 4 }}>
                Aggregated violations across all zones, hour-of-day.
              </p>
            </div>
            {peakHour && (
              <div style={{ textAlign: "right" }}>
                <div className="overline overline-red">Peak Hour</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  marginTop: 6, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22,
                  color: "var(--signal-red)",
                }}>
                  {peakHour.hour < 6 || peakHour.hour > 18 ? <Moon size={16} /> : <Sun size={16} />}
                  {peakHour.hourLabel}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {peakHour.violations.toLocaleString()} violations
                </div>
              </div>
            )}
          </div>
          <TrafficWave data={hourlyWaveData} />
        </div>
      </div>

      {/* Police stations */}
      {policeData.length > 0 && (
        <div className="card card-pad" data-testid="police-stations-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <Building2 size={16} color="var(--primary)" />
            <div className="overline">◉ Jurisdiction Load</div>
          </div>
          <h3 style={{ fontSize: 18, marginTop: 6 }}>Zones per Police Station Jurisdiction</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 4 }}>
            Use this to allocate beat resources and coordinate cross-jurisdiction sweeps.
          </p>
          <PoliceStationBar data={policeData} />
        </div>
      )}
    </div>
  );
}
