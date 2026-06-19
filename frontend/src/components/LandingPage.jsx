import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Eye, Brain, Compass, Send, Activity,
  MapPin, ShieldCheck, AlertTriangle, Clock, Quote,
} from "lucide-react";
import MultilingualBengaluru, { SCRIPTS } from "@/components/MultilingualBengaluru";
import Odometer from "@/components/Odometer";
import { getAnalytics, getRecommendations } from "@/utils/api";

const JOURNEY_STEPS = [
  { id: 1, icon: Eye,     title: "Detect",  kn: "ಪತ್ತೆ",
    body: "Pull live violation density across 40+ Bengaluru zones — from Indiranagar's 100 Ft Road to Whitefield's ITPL corridor." },
  { id: 2, icon: Brain,   title: "Analyse", kn: "ವಿಶ್ಲೇಷಣೆ",
    body: "A composite Impact Score weighs vehicle mix, junction proximity and enforcement difficulty — not just raw counts." },
  { id: 3, icon: Compass, title: "Decide",  kn: "ತೀರ್ಮಾನ",
    body: "Rule + classification engine flags Critical, Hidden Risk, Frequent, Moderate or Stable. Gemini briefs the why." },
  { id: 4, icon: Send,    title: "Deploy",  kn: "ನಿಯೋಜನೆ",
    body: "Time-windowed patrolling, towing routes, infrastructure intervention — each card is a dispatch-ready action." },
  { id: 5, icon: Activity,title: "Reflect", kn: "ಪ್ರತಿಬಿಂಬ",
    body: "Track which zones are cooling, which are heating. Re-prioritise weekly. The city is a living organism." },
];

export default function LandingPage({ onEnter }) {
  const [active, setActive] = useState(SCRIPTS[0]);
  const [stats, setStats] = useState({ zones: 0, violations: 0, hidden: 0, critical: 0 });

  useEffect(() => {
    Promise.all([getAnalytics(), getRecommendations()])
      .then(([a, r]) => {
        const counts = r.classification_counts || {};
        setStats({
          zones: a.total_zones || 0,
          violations: a.total_violations || 0,
          hidden: counts["Hidden Risk Zone"] || 0,
          critical: counts["Critical Zone"] || 0,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="paper-grid" data-testid="landing-page">
      {/* ====================================================
          HERO — multilingual Bengaluru
          ==================================================== */}
      <section style={{
        position: "relative",
        padding: "72px 32px 96px",
        maxWidth: 1280, margin: "0 auto",
        overflow: "hidden",
      }}>
        {/* faded background motif */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage:
            "radial-gradient(ellipse at 20% 30%, rgba(45,106,79,0.10), transparent 55%), " +
            "radial-gradient(ellipse at 90% 70%, rgba(233,196,106,0.20), transparent 60%)",
          pointerEvents: "none",
        }} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: "relative" }}
        >
          <div className="overline overline-red" style={{ marginBottom: 18 }}>
            ◉ Bengaluru City Traffic Police · Intelligence Console
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(48px, 8vw, 124px)",
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            margin: "0 0 14px",
          }}>
            Namma
            <br />
            <span style={{
              fontFamily: active.fontFamily,
              color: "var(--primary)",
              dir: active.dir,
            }}>
              <MultilingualBengaluru onIndexChange={setActive} />
            </span>
          </h1>

          <p style={{
            fontSize: 19,
            lineHeight: 1.55,
            maxWidth: 720,
            color: "var(--text-secondary)",
            margin: "20px 0 36px",
          }}>
            Bengaluru moves on auto-rickshaws, software engineers, and a stubborn refusal to honk less.
            We can't fix the city overnight — but we can <strong style={{ color: "var(--text-primary)" }}>see it clearly</strong>,
            block by block, hour by hour. <span style={{ color: "var(--primary)", fontWeight: 600 }}>
            Namma {active.text}</span> is the operational brain for the Traffic Police —
            turning a million parking violations into <em>where to stand, when, and why</em>.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={onEnter}
              data-testid="cta-enter-console"
              style={{ padding: "16px 28px", fontSize: 15 }}
            >
              Enter Operations Console
              <ArrowRight size={17} />
            </button>
            <a
              className="btn btn-ghost"
              href="#how-it-works"
              data-testid="cta-how-it-works"
              style={{ padding: "16px 24px", fontSize: 14 }}
            >
              See how it works
            </a>
          </div>

          {/* live ticker strip */}
          <div style={{
            marginTop: 64,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 1,
            background: "var(--border)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }} data-testid="landing-stats">
            {[
              { label: "Risk Zones Tracked", value: stats.zones, color: "var(--primary)" },
              { label: "Violations Mapped",  value: stats.violations, color: "var(--text-primary)" },
              { label: "Critical Hotspots",  value: stats.critical, color: "var(--signal-red)" },
              { label: "Hidden Risks Found", value: stats.hidden,  color: "var(--auto-yellow-deep)" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--bg-paper)", padding: "20px 22px" }}>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}>{s.label}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: s.color }}>
                  <Odometer value={s.value} duration={1800} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ====================================================
          EMOTION — the city we're trying to save
          ==================================================== */}
      <section style={{
        background: "var(--bg-sand)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "72px 32px",
      }} data-testid="landing-emotion">
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid",
          gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}
          className="emotion-grid"
        >
          <div>
            <div className="overline" style={{ marginBottom: 14 }}>The City We Live In</div>
            <h2 style={{ fontSize: 38, lineHeight: 1.1, marginBottom: 18, fontWeight: 800 }}>
              A 90-minute commute should not be the city's love language.
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16.5, lineHeight: 1.65, marginBottom: 18 }}>
              Every evening between 6 PM and 9 PM, Outer Ring Road becomes a 22-kilometre parking lot.
              Footpaths in Koramangala disappear under double-parked SUVs. An ambulance on
              Hosur Road waits behind a wedding convoy. Auto drivers know which junctions to
              avoid; the rest of us learn the hard way.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 16.5, lineHeight: 1.65 }}>
              The Traffic Police don't lack effort — they lack <strong style={{ color: "var(--text-primary)" }}>
              where</strong>, <strong style={{ color: "var(--text-primary)" }}>when</strong>, and{" "}
              <strong style={{ color: "var(--text-primary)" }}>which one first</strong>.
              That's the entire mission of this console.
            </p>
          </div>

          <div style={{
            position: "relative",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border)",
            aspectRatio: "4 / 5",
            background: "var(--primary-dark)",
          }}>
            <img
              src="https://images.pexels.com/photos/36997696/pexels-photo-36997696.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720"
              alt="Bengaluru auto-rickshaw traffic"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.95 }}
              loading="lazy"
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 40%, rgba(8, 28, 21, 0.85))",
            }} />
            <div style={{
              position: "absolute", left: 22, right: 22, bottom: 22,
              color: "white",
            }}>
              <Quote size={22} style={{ opacity: 0.6, marginBottom: 8 }} />
              <p style={{ fontSize: 18, lineHeight: 1.4, fontWeight: 500, marginBottom: 10 }}>
                "Traffic-alli sigaakkidini saar. Sometimes it feels like the auto is moving slower than the metro work."
              </p>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", opacity: 0.7 }}>
                — Every Bengalurean, every evening
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          THE JOURNEY — Detect → Analyse → Decide → Deploy → Reflect
          ==================================================== */}
      <section id="how-it-works" style={{ padding: "84px 32px", maxWidth: 1280, margin: "0 auto" }}
        data-testid="landing-journey"
      >
        <div className="overline" style={{ marginBottom: 12 }}>The Operational Journey</div>
        <h2 style={{ fontSize: 36, marginBottom: 12, fontWeight: 800 }}>
          From a thousand violations to one clear next move.
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 720, marginBottom: 48 }}>
          Every officer's day on the console follows the same five beats. No dashboards full of noise —
          just the next decision, surfaced clearly.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          position: "relative",
        }} className="stagger">
          {JOURNEY_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="card card-pad" style={{ position: "relative" }}
                data-testid={`journey-step-${step.id}`}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: i === 0 ? "var(--signal-red-tint)" :
                                i === 1 ? "var(--auto-yellow-tint)" :
                                i === 2 ? "var(--primary-tint)" :
                                i === 3 ? "var(--primary-tint)" : "var(--bg-sand)",
                    display: "grid", placeItems: "center",
                    color: i === 0 ? "var(--signal-red)" :
                           i === 1 ? "var(--auto-yellow-deep)" :
                           i === 2 ? "var(--primary)" :
                           i === 3 ? "var(--primary)" : "var(--text-secondary)",
                  }}>
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11, letterSpacing: "0.18em",
                    color: "var(--text-muted)",
                  }}>0{step.id}</span>
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 2 }}>{step.title}</h3>
                <div style={{
                  fontFamily: "var(--font-kannada)", fontSize: 14,
                  color: "var(--primary)", marginBottom: 12, fontWeight: 500,
                }}>{step.kn}</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================
          WHAT THE CONSOLE GIVES YOU
          ==================================================== */}
      <section style={{
        background: "var(--primary-dark)",
        color: "var(--text-on-dark)",
        padding: "84px 32px",
      }} data-testid="landing-features">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="overline" style={{ color: "var(--auto-yellow)", marginBottom: 14 }}>
            What Officers Actually See
          </div>
          <h2 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 48, color: "var(--text-on-dark)", maxWidth: 780 }}>
            Three views. One decision flow. Built for the briefing room — not the boardroom.
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }} className="stagger">
            {[
              {
                tag: "Map 1 · Where",
                title: "Violation Density Map",
                body: "Color-graded markers across Bengaluru showing where violations cluster — by percentile, not raw count. Identical-looking junctions stop looking identical.",
                icon: MapPin,
                accent: "var(--auto-yellow)",
              },
              {
                tag: "Map 2 · Which First",
                title: "Operational Impact Map",
                body: "Same city, re-ranked. Composite Impact Score factors in vehicle weight, junction proximity, and average resolution time so HSR Layout's deceptively-quiet streets stop slipping through.",
                icon: AlertTriangle,
                accent: "var(--signal-red-light)",
              },
              {
                tag: "Action Center",
                title: "Dispatch-Ready Cards",
                body: "Each zone arrives with a classification, a rule-engine action list, and a Gemini-written briefing on why this matters today — read it like a case file, not a dashboard.",
                icon: ShieldCheck,
                accent: "var(--primary-light)",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "var(--r-lg)",
                  padding: "26px 24px 28px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: f.accent,
                  }} />
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    display: "grid", placeItems: "center",
                    color: f.accent, marginBottom: 18,
                  }}>
                    <Icon size={20} />
                  </div>
                  <div className="overline" style={{ color: f.accent, marginBottom: 6 }}>
                    {f.tag}
                  </div>
                  <h3 style={{ fontSize: 21, marginBottom: 12, color: "var(--text-on-dark)" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(248,246,240,0.75)", margin: 0 }}>
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 48, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={onEnter}
              data-testid="cta-enter-console-2"
              style={{
                background: "var(--auto-yellow)",
                color: "var(--primary-dark)",
                padding: "16px 26px",
              }}
            >
              Open the Live City Map
              <ArrowRight size={17} />
            </button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5,
              letterSpacing: "0.18em", color: "rgba(248,246,240,0.5)", textTransform: "uppercase" }}>
              <Clock size={11} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Updated continuously from Bengaluru Traffic Police data
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================
          FOOTER
          ==================================================== */}
      <footer style={{
        padding: "36px 32px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 12.5,
      }} data-testid="landing-footer">
        <div style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          Namma Bengaluru · Built for the men &amp; women in the white &amp; blue.
        </div>
      </footer>
    </div>
  );
}
