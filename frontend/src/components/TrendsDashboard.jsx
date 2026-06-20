import React, { useState, useEffect } from "react";
import { getHotspots, compareTrends, getTrendsMaxDate, explainTrends } from "@/utils/api";
import MultiSelectDropdown from "./MultiSelectDropdown";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Clock, AlertTriangle, ShieldCheck, ArrowRight,
  GitCompare, Calendar, LoaderCircle, Sparkles, AlertCircle
} from "lucide-react";

const VEHICLES = ["BIKE", "CAR", "AUTO", "MAXI CAB", "BUS", "TRUCK", "OTHERS"];
const SIDE_A_COLOR = "#1B4332"; // Green
const SIDE_B_COLOR = "#C99A2E"; // Gold

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="trends-tooltip">
      <div className="trends-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="trends-tooltip__row">
          <span className="trends-tooltip__dot" style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{(p.value || 0).toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

export default function TrendsDashboard() {
  const [zoneOptions, setZoneOptions] = useState([]);
  const [maxDate, setMaxDate] = useState("2024-04-08");
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Single selections (wrapped in array for MultiSelectDropdown support)
  const [selectedA, setSelectedA] = useState([]);
  const [selectedB, setSelectedB] = useState([]);

  // Time Slice selection (Hours 0 - 23)
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);

  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gemini Suggestion Engine state
  const [geminiResult, setGeminiResult] = useState(null);
  const [generatingGemini, setGeneratingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState(null);

  // Initial Load: Options and Date bounds
  useEffect(() => {
    async function init() {
      try {
        const [hotspots, range] = await Promise.all([getHotspots(), getTrendsMaxDate()]);
        const opts = hotspots.map((h) => ({ value: h.zone_id, label: h.zone_name }));
        setZoneOptions(opts);
        setMaxDate(range.max_date || "2024-04-08");
        
        if (opts.length > 0) {
          setSelectedA([opts[0].value]);
          setSelectedB([opts.length > 1 ? opts[1].value : opts[0].value]);
        }
      } catch (err) {
        console.error("Failed to initialize trends dashboard:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    init();
  }, []);

  // Fetch Comparative Analytics dynamically on filter changes
  useEffect(() => {
    async function fetchData() {
      if (selectedA.length === 0 || selectedB.length === 0) {
        setDataA(null);
        setDataB(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      setGeminiResult(null); // Clear previous AI suggestion when filters change

      try {
        const res = await compareTrends(selectedA[0], selectedB[0], startHour, endHour);
        setDataA(res.zone_a);
        setDataB(res.zone_b);
        if (res.max_date) {
          setMaxDate(res.max_date);
        }
      } catch (err) {
        console.error("Failed to fetch comparison metrics:", err);
        setError("Failed to retrieve dynamic analytics for the selected range.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedA, selectedB, startHour, endHour]);

  // Call backend trends AI explainer
  const handleGenerateSuggestions = async () => {
    if (!dataA || !dataB) return;
    setGeneratingGemini(true);
    setGeminiError(null);
    try {
      const payload = {
        zone_a: dataA,
        zone_b: dataB,
        start_hour: startHour,
        end_hour: endHour,
      };
      const res = await explainTrends(payload);
      setGeminiResult(res);
    } catch (err) {
      console.error("Failed to fetch suggestions from Gemini:", err);
      setGeminiError("Suggestions briefing generation failed. Verify network or API key.");
    } finally {
      setGeneratingGemini(false);
    }
  };

  // Mutual exclusion: exclude selected zone on opposite side
  const optionsA = zoneOptions.filter((opt) => !selectedB.includes(opt.value));
  const optionsB = zoneOptions.filter((opt) => !selectedA.includes(opt.value));

  // Single-select wrapper for A
  const handleSelectA = (arr) => {
    if (arr.length > 0) {
      setSelectedA([arr[arr.length - 1]]); // Only keep the last selected
    } else {
      setSelectedA([]);
    }
  };

  // Single-select wrapper for B
  const handleSelectB = (arr) => {
    if (arr.length > 0) {
      setSelectedB([arr[arr.length - 1]]); // Only keep the last selected
    } else {
      setSelectedB([]);
    }
  };

  // Dynamically crop X-axis and map LineChart hourly data
  const hourlyData = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => {
      const h = startHour + i;
      return {
        hour: `${String(h).padStart(2, "0")}:00`,
        "Side A": dataA?.hourly_distribution?.[h] || 0,
        "Side B": dataB?.hourly_distribution?.[h] || 0,
      };
    }
  );

  // Grouped BarChart vehicle data
  const vehicleData = VEHICLES.map((v) => ({
    name: v,
    "Side A": dataA ? (dataA.vehicle_distribution[v] || 0) : 0,
    "Side B": dataB ? (dataB.vehicle_distribution[v] || 0) : 0,
  }));

  const kpis = [
    { icon: AlertTriangle, label: "Total violations", valA: dataA?.total_violations?.toLocaleString(), valB: dataB?.total_violations?.toLocaleString() },
    { icon: TrendingUp, label: "Avg impact score", valA: dataA?.impact_score, valB: dataB?.impact_score },
    { icon: Clock, label: "Resolution (hrs)", valA: dataA?.avg_resolution_time?.toFixed(1), valB: dataB?.avg_resolution_time?.toFixed(1) },
    { icon: ShieldCheck, label: "Junction proximity", valA: dataA ? `${(dataA.junction_ratio * 100).toFixed(1)}%` : null, valB: dataB ? `${(dataB.junction_ratio * 100).toFixed(1)}%` : null },
  ];

  // Render hour drop options (00:00 to 23:00)
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${String(i).padStart(2, "0")}:00`,
  }));

  const handleStartHourChange = (e) => {
    const val = parseInt(e.target.value);
    setStartHour(val);
    if (val > endHour) {
      setEndHour(val);
    }
  };

  const handleEndHourChange = (e) => {
    const val = parseInt(e.target.value);
    setEndHour(val);
    if (val < startHour) {
      setStartHour(val);
    }
  };

  // Convert locked date display into formatted string
  const getFormattedDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  if (loadingOptions) {
    return (
      <div className="page-shell trends-page" data-testid="trends-page">
        <div className="trends-loading">
          <LoaderCircle size={24} className="spin" />
          <span>Loading comparison workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell trends-page" data-testid="trends-page">
      {/* Header and locked Date display */}
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <span className="overline">◉ Trends &amp; comparison</span>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>Compare Zones Side-by-Side</h2>
          <p>
            Analyse vehicle mix, hourly rhythms, and enforcement difficulty of two zones 
            during a selected hourly period over a 1-month evaluation window.
          </p>
        </div>
        <div className="trends-legend-key">
          <span><i style={{ background: SIDE_A_COLOR }} /> Arm A · Green</span>
          <span><i style={{ background: SIDE_B_COLOR }} /> Arm B · Gold</span>
        </div>
      </div>

      {/* Global Locked Date & Time Range Panel */}
      <div className="card card-pad" style={{ marginBottom: 24, background: "var(--bg-paper)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={18} style={{ color: "var(--primary)" }} />
            <div>
              <span className="overline" style={{ fontSize: 10 }}>Time-Slice Analysis</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Enforcement Evaluation (1-Month Window)
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="start-hour-select" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>Time Range:</label>
              <select
                id="start-hour-select"
                value={startHour}
                onChange={handleStartHourChange}
                className="date-filter__input"
                style={{ width: 90, padding: "6px 10px", borderRadius: 8 }}
              >
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <span style={{ color: "var(--text-muted)" }}>to</span>
            <div>
              <select
                id="end-hour-select"
                aria-label="End Hour"
                value={endHour}
                onChange={handleEndHourChange}
                className="date-filter__input"
                style={{ width: 90, padding: "6px 10px", borderRadius: 8 }}
              >
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown selectors for Zone A and Zone B */}
      <div className="trends-config-grid stagger" style={{ marginBottom: 24 }}>
        {/* Arm A Setup */}
        <div className="card trends-config trends-config--a" data-testid="trends-config-A">
          <div className="trends-config__stripe trends-config__stripe--a" />
          <div className="card-pad">
            <div className="trends-config__head">
              <span className="trends-side-badge trends-side-badge--a">A</span>
              <div>
                <span className="overline">Comparison Arm A</span>
                <h3 className="trends-config__title">Zone Selection A</h3>
              </div>
            </div>
            <div className="trends-field" style={{ marginTop: 14 }}>
              <MultiSelectDropdown
                options={optionsA}
                selected={selectedA}
                onChange={handleSelectA}
                placeholder="Choose Zone A…"
                accentColor={SIDE_A_COLOR}
              />
            </div>
            <div className="trends-config__foot">
              {loading && <span className="trends-config__status"><LoaderCircle size={12} className="spin" /> Updating…</span>}
              {!loading && dataA && (
                <span className="trends-config__status trends-config__status--ok">
                  {dataA.total_violations.toLocaleString()} violations in range
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="trends-vs-badge" aria-hidden="true">
          <GitCompare size={18} />
        </div>

        {/* Arm B Setup */}
        <div className="card trends-config trends-config--b" data-testid="trends-config-B">
          <div className="trends-config__stripe trends-config__stripe--b" />
          <div className="card-pad">
            <div className="trends-config__head">
              <span className="trends-side-badge trends-side-badge--b">B</span>
              <div>
                <span className="overline">Comparison Arm B</span>
                <h3 className="trends-config__title">Zone Selection B</h3>
              </div>
            </div>
            <div className="trends-field" style={{ marginTop: 14 }}>
              <MultiSelectDropdown
                options={optionsB}
                selected={selectedB}
                onChange={handleSelectB}
                placeholder="Choose Zone B…"
                accentColor={SIDE_B_COLOR}
              />
            </div>
            <div className="trends-config__foot">
              {loading && <span className="trends-config__status"><LoaderCircle size={12} className="spin" /> Updating…</span>}
              {!loading && dataB && (
                <span className="trends-config__status trends-config__status--ok">
                  {dataB.total_violations.toLocaleString()} violations in range
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card card-pad" style={{ borderLeft: "4px solid var(--signal-red)", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--signal-red)" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* KPI Comparison Cards */}
      <div className="trends-kpi-grid stagger" style={{ marginBottom: 24 }}>
        {kpis.map(({ icon: Icon, label, valA, valB }, i) => (
          <div key={i} className="card card-pad trends-kpi">
            <div className="trends-kpi__label">
              <Icon size={14} />
              <span>{label}</span>
            </div>
            <div className="trends-kpi__compare">
              <div className="trends-kpi__val trends-kpi__val--a">
                {loading ? "…" : (valA ?? "0")}
              </div>
              <span className="trends-kpi__vs">vs</span>
              <div className="trends-kpi__val trends-kpi__val--b">
                {loading ? "…" : (valB ?? "0")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="trends-charts stagger" style={{ marginBottom: 24 }}>
        {/* Hourly distribution */}
        <div className="card card-pad">
          <div className="trends-chart-head">
            <div>
              <span className="overline">Hourly rhythms ({String(startHour).padStart(2, "0")}:00 to {String(endHour).padStart(2, "0")}:00)</span>
              <h3>Enforcement hour trends</h3>
            </div>
            <div className="trends-chart-legend">
              <span><i style={{ background: SIDE_A_COLOR }} />A</span>
              <span><i style={{ background: SIDE_B_COLOR }} />B</span>
            </div>
          </div>
          <div className="trends-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hourlyData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Side A" stroke={SIDE_A_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: SIDE_A_COLOR }} />
                <Line type="monotone" dataKey="Side B" stroke={SIDE_B_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: SIDE_B_COLOR }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle distribution */}
        <div className="card card-pad">
          <div className="trends-chart-head">
            <div>
              <span className="overline">Fleet profile comparison</span>
              <h3>Violations by vehicle class</h3>
            </div>
            <div className="trends-chart-legend">
              <span><i style={{ background: SIDE_A_COLOR }} />A</span>
              <span><i style={{ background: SIDE_B_COLOR }} />B</span>
            </div>
          </div>
          <div className="trends-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={vehicleData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Side A" fill={SIDE_A_COLOR} radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Side B" fill={SIDE_B_COLOR} radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top violation lists */}
      <div className="trends-violations stagger" style={{ marginBottom: 24 }}>
        {[
          { data: dataA, side: "A", name: dataA?.zone_name || "Zone A", accent: SIDE_A_COLOR, accentClass: "a" },
          { data: dataB, side: "B", name: dataB?.zone_name || "Zone B", accent: SIDE_B_COLOR, accentClass: "b" },
        ].map(({ data, side, name, accent, accentClass }) => (
          <div key={side} className="card card-pad">
            <div className="trends-violations__head">
              <span className={`trends-side-badge trends-side-badge--${accentClass}`}>{side}</span>
              <h3>Top violation categories ({name})</h3>
            </div>
            {loading && <p className="trends-empty">Refreshing data…</p>}
            {!loading && (!data || !data.top_violation_types?.length) && (
              <p className="trends-empty">No violations recorded for this zone and hour range.</p>
            )}
            {!loading && data && data.top_violation_types && (
              <ol className="trends-violation-list" style={{ marginTop: 14 }}>
                {data.top_violation_types.map((v, i) => {
                  const max = data.top_violation_types[0]?.count || 1;
                  const pct = (v.count / max) * 100;
                  return (
                    <li key={i} className="trends-violation-item">
                      <div className="trends-violation-item__top">
                        <span className="trends-violation-rank" style={{ color: accent }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="trends-violation-name">{v.type}</span>
                        <span className="trends-violation-count" style={{ color: accent }}>
                          {v.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="danger-bar-track">
                        <div className="danger-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, var(--signal-red))` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        ))}
      </div>

      {/* AI SUGGESTIONS SECTION */}
      <div className="card card-pad" style={{ background: "var(--primary-tint)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
              <Sparkles size={18} style={{ color: "var(--primary)" }} />
              AI Operational Dispatch suggestions
            </h3>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
              Generate comparative patrol suggestions, towing allocation plans, and joint dispatch tactics.
            </p>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            disabled={loading || generatingGemini || selectedA.length === 0 || selectedB.length === 0}
            className="btn btn-primary"
            style={{ padding: "10px 18px", fontSize: 13, gap: 6 }}
          >
            {generatingGemini ? (
              <>
                <LoaderCircle size={14} className="spin" />
                Gemini analyzing…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate suggestions
              </>
            )}
          </button>
        </div>

        {geminiError && (
          <div style={{ color: "var(--signal-red)", fontSize: 13, padding: "8px 0" }}>
            {geminiError}
          </div>
        )}

        {geminiResult && (
          <div style={{ marginTop: 16 }} className="stagger">
            <div style={{ padding: "12px 14px", background: "var(--bg-paper)", borderRadius: 8, marginBottom: 14 }}>
              <span className="overline" style={{ fontSize: 9.5 }}>Comparison Briefing</span>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "6px 0 0 0", color: "var(--text-primary)" }}>
                {geminiResult.comparison_summary}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 14 }}>
              {/* Zone A suggestions */}
              <div style={{ padding: "12px 14px", background: "var(--bg-paper)", borderRadius: 8, borderLeft: `3px solid ${SIDE_A_COLOR}` }}>
                <span className="overline" style={{ color: SIDE_A_COLOR, fontSize: 9.5 }}>Arm A suggestions · {dataA?.zone_name}</span>
                <ul className="briefing-action-list" style={{ marginTop: 8 }}>
                  {geminiResult.zone_a_suggestions?.map((item, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Zone B suggestions */}
              <div style={{ padding: "12px 14px", background: "var(--bg-paper)", borderRadius: 8, borderLeft: `3px solid ${SIDE_B_COLOR}` }}>
                <span className="overline" style={{ color: SIDE_B_COLOR, fontSize: 9.5 }}>Arm B suggestions · {dataB?.zone_name}</span>
                <ul className="briefing-action-list" style={{ marginTop: 8 }}>
                  {geminiResult.zone_b_suggestions?.map((item, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "var(--bg-sand)", borderRadius: 8 }}>
              <span className="overline" style={{ fontSize: 9.5, color: "var(--primary)" }}>Joint Resource allocation Strategy</span>
              <p style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, margin: "6px 0 0 0", color: "var(--text-primary)" }}>
                {geminiResult.joint_dispatch_strategy}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
