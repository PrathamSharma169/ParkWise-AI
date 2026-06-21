import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ShieldCheck, Activity, EyeOff,
  Filter, Sparkles, LoaderCircle, ChevronRight, ListChecks,
} from "lucide-react";
import { getRecommendations, explainZoneRisk, getHotspotDetail } from "@/utils/api";
import ZoneDetails from "@/components/ZoneDetails";

const CLASSIFICATIONS = [
  { id: "all",                          label: "All Zones",          color: "var(--text-primary)",  icon: ListChecks },
  { id: "Critical Zone",                label: "Critical",           color: "var(--signal-red)",    icon: AlertTriangle },
  { id: "Frequent Violation Zone",      label: "Frequent",           color: "var(--auto-yellow-deep)", icon: Activity },
  { id: "Hidden Risk Zone",             label: "Hidden Risk",        color: "#7E22CE",              icon: EyeOff },
  { id: "Moderate Zone",                label: "Moderate",           color: "var(--auto-yellow)",   icon: Activity },
  { id: "Stable Zone",                  label: "Stable",             color: "var(--signal-green)",  icon: ShieldCheck },
];

const META = {
  "Critical Zone":           { bg: "var(--signal-red)",       fg: "white", note: "Deploy immediately" },
  "Frequent Violation Zone": { bg: "var(--auto-yellow-deep)", fg: "white", note: "Sustained patrol" },
  "Hidden Risk Zone":        { bg: "#7E22CE",                 fg: "white", note: "Increase visibility" },
  "Moderate Zone":           { bg: "var(--auto-yellow)",      fg: "var(--primary-dark)", note: "Scheduled review" },
  "Stable Zone":             { bg: "var(--signal-green)",     fg: "white", note: "Routine monitoring" },
};

function ZoneCard({ zone, onOpen, startDate, endDate }) {
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const meta = META[zone.zone_classification] || META["Moderate Zone"];
  const isCritical = zone.zone_classification === "Critical Zone";

  async function fetchExplain(e) {
    e.stopPropagation();
    if (ai) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await explainZoneRisk(zone.zone_id, startDate, endDate);
      setAi(r);
    } catch (e2) {
      setErr("Couldn't generate briefing right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" data-testid={`zone-card-${zone.zone_id}`}>
      {isCritical && <div className="hazard-stripe" />}
      <div className="card-pad">
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 999,
              background: meta.bg, color: meta.fg,
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11,
              letterSpacing: "0.04em",
              marginBottom: 10,
            }} data-testid={`zone-classification-${zone.zone_id}`}>
              {zone.zone_classification.replace(" Zone", "").toUpperCase()}
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
              {zone.zone_name}
            </h3>
            <div className="overline" style={{ marginTop: 6 }}>
              {meta.note}
            </div>
          </div>
          <button
            onClick={() => onOpen(zone.zone_id)}
            className="btn btn-ghost"
            style={{ padding: "8px 12px", fontSize: 12 }}
            data-testid={`open-case-file-${zone.zone_id}`}
          >
            Case file <ChevronRight size={13} />
          </button>
        </div>

        {/* metric strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          background: "var(--bg-sand)", borderRadius: "var(--r-md)",
          padding: "12px 8px", marginBottom: 16, gap: 4,
        }}>
          {[
            { label: "Impact",    value: zone.impact_score?.toFixed(1) },
            { label: "Violations", value: zone.total_violations?.toLocaleString() },
            { label: "Density #",  value: `#${zone.density_rank}` },
            { label: "Impact #",   value: `#${zone.impact_rank}` },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 9.5,
                letterSpacing: "0.16em", textTransform: "uppercase",
                color: "var(--text-muted)", marginBottom: 3,
              }}>{m.label}</div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
                color: "var(--text-primary)",
              }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* recommendations */}
        {zone.recommendations?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="overline" style={{ marginBottom: 8 }}>◉ Dispatch Actions</div>
            <ul className="briefing-action-list">
              {zone.recommendations.slice(0, 4).map((r, i) => (
                <li
                  key={i}
                  data-testid={`recommendation-${zone.zone_id}-${i}`}
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI briefing */}
        <div style={{
          background: "var(--primary-tint)",
          borderRadius: "var(--r-md)",
          padding: "12px 14px",
        }}>
          {!ai && !loading && (
            <button
              onClick={fetchExplain}
              className="explain-risk-btn"
              data-testid={`explain-risk-${zone.zone_id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                color: "var(--primary)", fontWeight: 600, fontSize: 13,
                cursor: "pointer", background: "transparent", border: "none",
              }}
            >
              <Sparkles size={14} /> Generate AI Briefing
            </button>
          )}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", fontSize: 13 }}>
              <LoaderCircle size={14} style={{ animation: "spin 1s linear infinite" }} />
              Namma AI analysing this zone…
            </div>
          )}
          {err && <div style={{ color: "var(--signal-red)", fontSize: 12 }}>{err}</div>}
          {ai && (
            <div data-testid={`ai-briefing-${zone.zone_id}`} style={{ fontSize: 13, lineHeight: 1.55 }}>
              <div className="overline" style={{ marginBottom: 6, color: "var(--primary)" }}>
                <Sparkles size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                AI Briefing
              </div>
              <p style={{ margin: "0 0 8px", color: "var(--text-primary)" }}>{ai.risk_summary}</p>
              {ai.key_risk_factors?.length > 0 && (
                <ul style={{ margin: "8px 0 8px", paddingLeft: 18, color: "var(--text-secondary)" }}>
                  {ai.key_risk_factors.map((f, i) => <li key={i} style={{ marginBottom: 2 }}>{f}</li>)}
                </ul>
              )}
              <p style={{ margin: "8px 0 0", color: "var(--primary)", fontWeight: 500 }}>
                <strong>Expected benefit:</strong> {ai.expected_benefit}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationPanel({ startDate, endDate }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [openZoneId, setOpenZoneId] = useState(null);
  const [openDetail, setOpenDetail] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRecommendations(startDate, endDate)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  const zones = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.all || [];
    return (data.all || []).filter((z) => z.zone_classification === filter);
  }, [data, filter]);

  async function openCase(zoneId) {
    setOpenZoneId(zoneId);
    setOpenLoading(true);
    try {
      const d = await getHotspotDetail(zoneId, startDate, endDate);
      setOpenDetail(d);
    } finally {
      setOpenLoading(false);
    }
  }

  if (!data) {
    return (
      <div className="page-shell" data-testid="recommendations-loading">
        <p style={{ color: "var(--text-muted)" }}>Loading dispatch center…</p>
      </div>
    );
  }

  const counts = data.classification_counts || {};

  return (
    <div className="page-shell" data-testid="recommendations-page">
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>{data.total} zones. One queue.</h2>
          <p>Every zone arrives with a classification, dispatch-ready actions, and an AI briefing on tap.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <Filter size={14} /> Filtering by classification
        </div>
      </div>

      {/* KPI strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12, marginBottom: 22,
      }} className="stagger" data-testid="classification-summary">
        {CLASSIFICATIONS.filter((c) => c.id !== "all").map((c) => {
          const count = counts[c.id] || 0;
          const Icon = c.icon;
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(active ? "all" : c.id)}
              className="card"
              data-testid={`classification-card-${c.id.replace(/\s+/g, '-').toLowerCase()}`}
              style={{
                padding: 16, cursor: "pointer", textAlign: "left",
                outline: active ? `2px solid ${c.color}` : "none",
                outlineOffset: -2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${c.color}20`, color: c.color,
                  display: "grid", placeItems: "center",
                }}>
                  <Icon size={14} />
                </div>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 10.5,
                  letterSpacing: "0.16em", textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}>{c.label}</span>
              </div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: 30, color: c.color, lineHeight: 1,
              }}>{count}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                {count === 1 ? "zone" : "zones"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter pills */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22,
      }} data-testid="filter-pills">
        {CLASSIFICATIONS.map((c) => {
          const Icon = c.icon;
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              data-testid={`filter-${c.id.replace(/\s+/g, '-').toLowerCase()}`}
              className={`nav-pill ${active ? "active" : ""}`}
              style={active && c.id !== "all" ? { background: c.color, color: "white" } : {}}
            >
              <Icon size={13} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Zone cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        gap: 16,
      }} className="stagger" data-testid="zone-cards">
        {zones.map((z) => (
          <ZoneCard key={z.zone_id} zone={z} onOpen={openCase} startDate={startDate} endDate={endDate} />
        ))}
        {zones.length === 0 && (
          <div className="card card-pad" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>No zones in this classification right now.</p>
          </div>
        )}
      </div>

      {openZoneId !== null && (
        <ZoneDetails
          detail={openDetail}
          loading={openLoading}
          onClose={() => { setOpenZoneId(null); setOpenDetail(null); }}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
