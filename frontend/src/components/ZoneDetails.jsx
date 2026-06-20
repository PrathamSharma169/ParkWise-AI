import React, { useEffect, useState } from "react";
import {
  X, ShieldCheck, MapPin, Car, Clock, Sparkles, LoaderCircle,
  AlertTriangle, FileText, Activity, ListChecks, Building2,
} from "lucide-react";
import { explainZoneRisk } from "@/utils/api";
import { getBriefingScopeTag, getScopeRhythmLabel, useConsoleScope } from "@/utils/useTemporalScope";

const VEHICLE_ICON = {
  CAR: "🚗", BIKE: "🏍️", AUTO: "🛺",
  "MAXI CAB": "🚐", BUS: "🚌", TRUCK: "🚚", OTHERS: "🚙",
};

const CLASSIFICATION_BADGE = {
  "Critical Zone":               { bg: "var(--signal-red)",      fg: "white",                    icon: AlertTriangle },
  "Frequent Violation Zone":     { bg: "var(--auto-yellow-deep)",fg: "white",                    icon: Activity },
  "Hidden Risk Zone":            { bg: "#7E22CE",                fg: "white",                    icon: AlertTriangle },
  "Moderate Zone":               { bg: "var(--auto-yellow)",     fg: "var(--primary-dark)",      icon: Activity },
  "Stable Zone":                 { bg: "var(--signal-green)",    fg: "white",                    icon: ShieldCheck },
};

function hourViolationCount(distribution, hour) {
  const d = distribution || {};
  const key = String(hour);
  return Number(d[key] ?? d[`${key}.0`] ?? d[hour] ?? 0);
}

function MiniHourBars({ distribution = {} }) {
  const entries = Array.from({ length: 24 }, (_, h) => hourViolationCount(distribution, h));
  const max = Math.max(1, ...entries);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56 }}>
      {entries.map((v, h) => {
        const heightPct = (v / max) * 100;
        const isPeak = (h >= 8 && h <= 11) || (h >= 17 && h <= 21);
        return (
          <div key={h} style={{ flex: 1, height: "100%", display: "flex",
            flexDirection: "column", justifyContent: "flex-end", alignItems: "stretch",
            position: "relative",
          }} title={`${h}:00 — ${v} violations`}>
            <div style={{
              height: `${Math.max(heightPct, 3)}%`,
              background: isPeak ? "linear-gradient(180deg, var(--signal-red), var(--auto-yellow-deep))"
                                 : "var(--primary-light)",
              borderRadius: "2px 2px 0 0",
              opacity: v === 0 ? 0.25 : 1,
            }} />
          </div>
        );
      })}
    </div>
  );
}

export default function ZoneDetails({ detail, loading, onClose, startDate, endDate }) {
  const { scopeMeta } = useConsoleScope();
  const scopeTag = getBriefingScopeTag(scopeMeta);
  const rhythmLabel = getScopeRhythmLabel(scopeMeta);
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    setAi(null);
    setAiError(null);
  }, [detail?.zone_id]);

  async function fetchExplain() {
    if (!detail) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const r = await explainZoneRisk(detail.zone_id, startDate, endDate);
      setAi(r);
    } catch (e) {
      setAiError("Unable to generate AI briefing right now.");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading || !detail) {
    return (
      <div className="field-briefing" data-testid="field-briefing">
        <div className="briefing-header">
          <span className="briefing-tag">◉ Loading Field Briefing</span>
          <h2 className="briefing-title">Pulling case file…</h2>
          <button className="briefing-close" onClick={onClose} data-testid="briefing-close">
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 40, display: "grid", placeItems: "center", flex: 1 }}>
          <LoaderCircle size={28} className="spin" style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const cls = detail.zone_classification || "Moderate Zone";
  const badge = CLASSIFICATION_BADGE[cls] || CLASSIFICATION_BADGE["Moderate Zone"];
  const BadgeIcon = badge.icon;

  const topVehicles = Object.entries(detail.vehicle_distribution || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="field-briefing" data-testid="field-briefing" id="zone-detail-panel">
      <div className="briefing-header">
        <button className="briefing-close" onClick={onClose} data-testid="briefing-close" aria-label="close">
          <X size={16} />
        </button>
        <span className="briefing-tag">
          ◉ OFFICIAL DISPATCH · CASE FILE #{String(detail.zone_id).padStart(3, "0")}
          {scopeTag ? ` · ${scopeTag}` : ""}
        </span>
        <h2 className="briefing-title" data-testid="briefing-zone-name">{detail.zone_name}</h2>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 999,
          background: badge.bg, color: badge.fg,
          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, marginBottom: 14,
        }} data-testid="briefing-classification">
          <BadgeIcon size={13} strokeWidth={2.5} />
          {cls.toUpperCase()}
        </div>

        <div className="briefing-meta">
          <div>
            Impact
            <strong>{(detail.impact_score || 0).toFixed(1)}<span style={{ fontSize: 10, opacity: 0.6 }}>/100</span></strong>
          </div>
          <div>
            Density Rank
            <strong>#{detail.density_rank || "—"}</strong>
          </div>
          <div>
            Impact Rank
            <strong>#{detail.impact_rank || "—"}</strong>
          </div>
          <div>
            Violations
            <strong>{(detail.total_violations || 0).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="briefing-body">
        {/* AI BRIEFING */}
        <div className="briefing-block" style={{
          borderColor: "var(--primary-tint)",
          background: "linear-gradient(180deg, var(--primary-tint) 0%, var(--bg-paper) 100%)",
        }}>
          <div className="briefing-block-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={12} color="var(--primary)" />
            AI Field Briefing · Gemini 2.5
          </div>

          {!ai && !aiLoading && (
            <>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: 1.55 }}>
                Generate a human-readable assessment of why this zone is on the watchlist
                and what the recommended action achieves.
              </p>
              <button
                className="btn btn-primary"
                onClick={fetchExplain}
                data-testid="explain-risk-btn"
                style={{ padding: "10px 18px", fontSize: 13 }}
              >
                <Sparkles size={14} />
                Generate Briefing
              </button>
            </>
          )}

          {aiLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", fontSize: 13 }}>
              <LoaderCircle size={16} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
              <span>Gemini is reading the case file…</span>
            </div>
          )}

          {aiError && (
            <div style={{ color: "var(--signal-red)", fontSize: 13 }}>{aiError}</div>
          )}

          {ai && (
            <div data-testid="ai-briefing-content" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="briefing-block-label">Risk Summary</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{ai.risk_summary}</p>
              </div>
              {ai.key_risk_factors?.length > 0 && (
                <div>
                  <div className="briefing-block-label">Key Risk Factors</div>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                    {ai.key_risk_factors.map((f, i) => <li key={i} style={{ marginBottom: 4 }}>{f}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <div className="briefing-block-label">Why this action</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{ai.recommendation_explanation}</p>
              </div>
              <div>
                <div className="briefing-block-label">Expected Benefit</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0, color: "var(--primary)" }}>
                  {ai.expected_benefit}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RECOMMENDED ACTIONS */}
        {detail.recommendations?.length > 0 && (
          <div className="briefing-block">
            <div className="briefing-block-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ListChecks size={12} />
              Recommended Actions
            </div>
            <ul className="briefing-action-list">
              {detail.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* HOURLY BARS */}
        <div className="briefing-block">
          <div className="briefing-block-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={12} />
            {rhythmLabel}
          </div>
          <MiniHourBars distribution={detail.hourly_distribution} />
          <div style={{ display: "flex", justifyContent: "space-between",
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)",
            marginTop: 6, letterSpacing: "0.06em",
          }}>
            <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-secondary)" }}>
            Peak windows highlighted in red — patrol &amp; enforcement should anchor here.
          </div>
        </div>

        {/* VEHICLE MIX */}
        <div className="briefing-block">
          <div className="briefing-block-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Car size={12} />
            Vehicle Mix
          </div>
          <div>
            {topVehicles.map(([type, count]) => (
              <span key={type} className="vehicle-pill">
                <span style={{ fontSize: 14 }}>{VEHICLE_ICON[type] || "🚗"}</span>
                {type}
                <span className="count">{count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* TOP STREETS */}
        {detail.top_locations?.length > 0 && (
          <div className="briefing-block">
            <div className="briefing-block-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={12} />
              Hottest Streets
            </div>
            {detail.top_locations.slice(0, 5).map((loc, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{loc.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12,
                  color: "var(--signal-red)", fontWeight: 600 }}>
                  {loc.count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* DISPATCH FOOTER */}
        <div className="briefing-block" style={{ background: "var(--bg-sand)", borderColor: "var(--border-strong)" }}>
          <div className="briefing-block-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={12} />
            Jurisdiction
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            {detail.police_station || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
