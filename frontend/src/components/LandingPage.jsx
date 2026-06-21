import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Eye, Brain, Compass, Send, Activity,
  MapPin, ShieldCheck, AlertTriangle, Clock, Quote,
  Github,
} from "lucide-react";
import MultilingualBengaluru from "@/components/MultilingualBengaluru";
import Odometer from "@/components/Odometer";
import { getAnalytics, getRecommendations } from "@/utils/api";
import { ROUTES } from "@/constants/routes";

const JOURNEY_STEPS = [
  { id: 1, icon: Eye,     title: "Detect",
    body: "Pull live violation density across 60+ Bengaluru zones from Indiranagar's 100 Ft Road to Whitefield's ITPL corridor." },
  { id: 2, icon: Brain,   title: "Analyse",
    body: "A composite Impact Score weighs vehicle mix, junction proximity and enforcement difficulty not just raw counts." },
  { id: 3, icon: Compass, title: "Decide",
    body: "Rule + classification engine flags Critical, Hidden Risk, Frequent, Moderate or Stable. Namma AI briefs the why." },
  { id: 4, icon: Send,    title: "Deploy",
    body: "Time windowed patrolling, towing routes, infrastructure intervention each card is a dispatch ready action." },
  { id: 5, icon: Activity,title: "Reflect",
    body: "Track which zones are cooling, which are heating. Re-prioritise weekly. The city is a living organism." },
];

const HERO_GALLERY = [
  {
    src: "https://th-i.thgim.com/public/incoming/ve1j6z/article70296412.ece/alternates/FREE_1200/DSC_4456.JPG",
    alt: "Bengaluru commuters going for their daily travel in the morning on the road.",
    slot: "main",
  },
  {
    src: "https://s3.ap-south-1.amazonaws.com/media.thesouthfirst.com/wp-content/uploads/2023/02/BTP.jpg",
    alt: "A famous view point where a vehicle spends its maximum time in signals.",
    slot: "top",
  },
  {
    src: "https://cf-images.assettype.com/tnm%2Fimport%2Fsites%2Fdefault%2Ffiles%2FBengaluru_traffic_police_rep_270622_1200.jpg",
    alt: "Bengaluru Traffic Police officer checking documents with a motorcyclist.",
    slot: "bottom",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
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
          HERO — copy + traffic gallery
          ==================================================== */}
      <section className="landing-hero" data-testid="landing-hero">
        <div className="landing-hero-bg" aria-hidden />
        <div className="landing-hero-watermark" aria-hidden>
          <img
            src={`${process.env.PUBLIC_URL}/logobengaluru.png`}
            alt=""
          />
        </div>

        <div className="landing-hero-inner">
          <motion.div
            className="landing-hero-copy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >

            <h1 className="landing-hero-title">
              Namma
              <br />
              <span className="hero-bengaluru-line">
                <MultilingualBengaluru />
              </span>
            </h1>

            <p className="landing-hero-lede">
            Bengaluru runs on chai, chaos, and SUVs parked like they own the footpath. We can't un jam the city overnight, but we can tell you which junction to hit first.
            </p>

            <div className="landing-hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate(ROUTES.map)}
                data-testid="cta-enter-console"
              >
                Enter Operations Console
                <ArrowRight size={17} />
              </button>
              <a
                className="btn btn-ghost"
                href="#how-it-works"
                data-testid="cta-how-it-works"
              >
                See how it works
              </a>
            </div>
          </motion.div>

          <motion.div
            className="landing-hero-gallery"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            aria-label="Traffic enforcement and city mobility"
          >
            {HERO_GALLERY.map((img, i) => (
              <figure
                key={img.slot}
                className={`hero-gallery-frame hero-gallery-${img.slot}`}
                style={{ animationDelay: `${0.08 + i * 0.06}s` }}
              >
                <img src={img.src} alt={img.alt} loading={i === 0 ? "eager" : "lazy"} />
                <figcaption className="hero-gallery-caption">{img.alt}</figcaption>
              </figure>
            ))}
          </motion.div>
        </div>

        <div className="landing-hero-stats-wrap" data-testid="landing-stats">
          <div className="landing-hero-stats">
            {[
              { label: "Risk Zones Tracked", value: stats.zones, color: "var(--primary)" },
              { label: "Violations Mapped",  value: stats.violations, color: "var(--text-primary)" },
              { label: "Critical Hotspots",  value: stats.critical, color: "var(--signal-red)" },
              { label: "Hidden Risks Found", value: stats.hidden,  color: "var(--auto-yellow-deep)" },
            ].map((s) => (
              <div key={s.label} className="landing-hero-stat">
                <div className="landing-hero-stat-label">{s.label}</div>
                <div className="landing-hero-stat-value" style={{ color: s.color }}>
                  <Odometer value={s.value} duration={1800} />
                </div>
              </div>
            ))}
          </div>
        </div>
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
              A 90 minute commute should not be the city's love language.
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16.5, lineHeight: 1.65, marginBottom: 18 }}>
              Every evening between 6 PM and 9 PM, Outer Ring Road becomes a 22 kilometre parking lot.
              Footpaths in Koramangala disappear under double parked SUVs. An ambulance on
              Hosur Road waits behind a wedding convoy. Auto drivers know which junctions to
              avoid; the rest of us learn the hard way.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 16.5, lineHeight: 1.65 }}>
              The Traffic Police don't lack effort, they lack <strong style={{ color: "var(--text-primary)" }}>
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
          Every officer's day on the console follows the same five beats. No dashboards full of noise just the next decision, surfaced clearly.
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
                <h3 style={{ fontSize: 20, marginBottom: 12 }}>{step.title}</h3>
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
            Three views. One decision flow. Built for the briefing room not the boardroom.
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
                body: "Color-graded markers across Bengaluru showing where violations cluster by percentile, not raw count. Identical looking junctions stop looking identical.",
                icon: MapPin,
                accent: "var(--auto-yellow)",
              },
              {
                tag: "Map 2 · Which First",
                title: "Operational Impact Map",
                body: "Same city, re ranked. Composite Impact Score factors in vehicle weight, junction proximity, and average resolution time so HSR Layout's deceptively quiet streets stop slipping through.",
                icon: AlertTriangle,
                accent: "var(--signal-red-light)",
              },
              {
                tag: "Action Center",
                title: "Dispatch-Ready Cards",
                body: "Each zone arrives with a classification, a rule engine action list, and a Namma AI written briefing on why this matters today read it like a case file, not a dashboard.",
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
              onClick={() => navigate(ROUTES.map)}
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

      <footer style={{
        padding: "24px 48px",
        color: "#000000",
        fontSize: 11.5,
      }} data-testid="landing-footer">
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            © {new Date().getFullYear()} ParkWise AI. All rights reserved.
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <a 
              href="https://github.com/PrathamSharma169/ParkWise-AI" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: "#000000",
                display: "inline-flex",
                alignItems: "center",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.15)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.0)"}
            >
              <Github size={18} />
            </a>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            made with ❤️ for a Bengaluriga
          </div>
        </div>
      </footer>
    </div>
  );
}
