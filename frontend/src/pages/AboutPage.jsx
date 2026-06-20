import React from "react";
import { Sparkles, ShieldCheck, MapPin, Activity } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="page-shell" data-testid="about-page" style={{ maxWidth: 900 }}>
      <div className="overline overline-red" style={{ marginBottom: 12 }}>◉ About the Console</div>
      <h2 style={{ fontSize: 32, marginBottom: 14 }}>
        Built for the men &amp; women who keep the city moving.
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 760 }}>
        Namma Bengaluru is a decision-support layer over Bengaluru City Traffic Police's
        own violation data. We don't replace officer judgement — we sharpen it by surfacing
        the right question at the right time.
      </p>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <MapPin size={18} color="var(--primary)" />
          <h3 style={{ fontSize: 18 }}>Map 1 · The Violation Density Map</h3>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Where parking violations happen most. Marker colour is bucketed by percentile
          (P25 → P90) so the eye spots the loudest streets without reading numbers.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="hazard-stripe" />
        <div className="card-pad">
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
            <Activity size={18} color="var(--signal-red)" />
            <h3 style={{ fontSize: 18 }}>Map 2 · The Operational Impact Map</h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Which zone to fix first. A composite Impact Score (0–100) factoring violation
            density (45%), vehicle weight mix (25%), junction proximity (15%) and
            enforcement difficulty (15%). Hidden Risk zones — low density but high impact —
            surface here.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <Sparkles size={18} color="var(--auto-yellow-deep)" />
          <h3 style={{ fontSize: 18 }}>Gemini-powered Field Briefings</h3>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          The LLM does not make decisions. The rule + classification engine does. Gemini 2.5
          Flash only explains <em>why</em> a zone landed where it did and what the recommended
          action achieves — written like a briefing note, not a chart caption.
        </p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16, background: "var(--bg-sand)", borderColor: "var(--border-strong)" }}>
        <div className="overline" style={{ marginBottom: 10 }}>◉ Technology Stack</div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}>
          {[
            ["Backend",         "Python · FastAPI"],
            ["Clustering",      "DBSCAN · scikit-learn"],
            ["Frontend",        "React · Recharts · Framer Motion"],
            ["Mapping",         "Leaflet · OpenStreetMap"],
            ["Briefing AI",     "Gemini 2.5 Flash"],
            ["Decision Engine", "Rule + Classification"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.16em",
                textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4,
              }}>{k}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 32, padding: "20px 24px",
        background: "var(--primary-dark)", color: "var(--text-on-dark)",
        borderRadius: "var(--r-lg)",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <ShieldCheck size={24} color="var(--auto-yellow)" />
        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
          For the Bengaluru City Traffic Police only. The recommendations on this console
          are advisory — final dispatch decisions remain with the officer on duty.
        </div>
      </div>
    </div>
  );
}
