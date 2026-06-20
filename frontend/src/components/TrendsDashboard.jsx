import React, { useState, useEffect } from "react";
import { getHotspots, getHotspotDetail, getDateRange } from "@/utils/api";
import MultiSelectDropdown from "./MultiSelectDropdown";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Clock, AlertTriangle, ShieldCheck, ArrowRight,
  GitCompare, Calendar, LoaderCircle,
} from "lucide-react";

const VEHICLES = ["BIKE", "CAR", "AUTO", "MAXI CAB", "BUS", "TRUCK", "OTHERS"];
const SIDE_A_COLOR = "#1B4332";
const SIDE_B_COLOR = "#C99A2E";

const PRESETS = [
  { key: "all", label: "All time" },
  { key: "nov23", label: "Nov 2023", start: "2023-11-01", end: "2023-11-30" },
  { key: "dec23", label: "Dec 2023", start: "2023-12-01", end: "2023-12-31" },
  { key: "mar24", label: "Mar 2024", start: "2024-03-01", end: "2024-03-31" },
  { key: "apr24", label: "Apr 2024", start: "2024-04-01", end: "2024-04-30" },
];

function DateControls({
  dateMode, setDateMode, singleDate, setSingleDate,
  startDate, setStartDate, endDate, setEndDate,
  preset, applyPreset, dateBounds, side,
}) {
  return (
    <div className="trends-date-controls">
      <div className="nav-pills trends-date-controls__modes">
        {[
          { id: "all", label: "Full dataset", icon: Clock },
          { id: "single", label: "Single day", icon: Calendar },
          { id: "range", label: "Date range", icon: Calendar },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-pill ${dateMode === id ? "active" : ""}`}
            onClick={() => setDateMode(id)}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {dateMode === "single" && (
        <div className="date-filter__inputs date-filter__inputs--single">
          <label className="date-filter__label" htmlFor={`trends-single-${side}`}>Select date</label>
          <input
            id={`trends-single-${side}`}
            type="date"
            value={singleDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setSingleDate(e.target.value)}
            className="date-filter__input"
          />
        </div>
      )}

      {dateMode === "range" && (
        <div className="date-filter__inputs date-filter__inputs--range">
          <div className="date-filter__field">
            <label className="date-filter__label" htmlFor={`trends-from-${side}`}>From</label>
            <input
              id={`trends-from-${side}`}
              type="date"
              value={startDate}
              min={dateBounds.min}
              max={dateBounds.max}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-filter__input"
            />
          </div>
          <ArrowRight size={14} className="date-filter__sep" aria-hidden="true" />
          <div className="date-filter__field">
            <label className="date-filter__label" htmlFor={`trends-to-${side}`}>To</label>
            <input
              id={`trends-to-${side}`}
              type="date"
              value={endDate}
              min={dateBounds.min}
              max={dateBounds.max}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-filter__input"
            />
          </div>
        </div>
      )}

      <div className="date-filter__presets">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`date-preset ${preset === p.key ? "date-preset--active" : ""}`}
            onClick={() => applyPreset(p.key, p.start, p.end)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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

function ConfigPanel({
  side, accent, accentClass, zoneOptions, selected, onSelect,
  dateMode, setDateMode, singleDate, setSingleDate,
  startDate, setStartDate, endDate, setEndDate,
  preset, applyPreset, dateBounds, loading, data, error,
}) {
  return (
    <div className={`card trends-config trends-config--${accentClass}`} data-testid={`trends-config-${side}`}>
      <div className={`trends-config__stripe trends-config__stripe--${accentClass}`} />
      <div className="card-pad">
        <div className="trends-config__head">
          <span className={`trends-side-badge trends-side-badge--${accentClass}`}>{side}</span>
          <div>
            <span className="overline">Comparison arm {side}</span>
            <h3 className="trends-config__title">Configuration {side}</h3>
          </div>
        </div>

        <div className="trends-field">
          <label className="trends-field__label">Zones</label>
          <MultiSelectDropdown
            options={zoneOptions}
            selected={selected}
            onChange={onSelect}
            placeholder="Select zones…"
            accentColor={accent}
          />
        </div>

        <div className="trends-field">
          <label className="trends-field__label">Time period</label>
          <DateControls
            side={side}
            dateMode={dateMode}
            setDateMode={setDateMode}
            singleDate={singleDate}
            setSingleDate={setSingleDate}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            preset={preset}
            applyPreset={applyPreset}
            dateBounds={dateBounds}
          />
        </div>

        <div className="trends-config__foot">
          {loading && (
            <span className="trends-config__status">
              <LoaderCircle size={13} className="spin" /> Fetching data…
            </span>
          )}
          {!loading && data && (
            <span className="trends-config__status trends-config__status--ok">
              {data.zoneCount} zone{data.zoneCount > 1 ? "s" : ""} · {data.total_violations.toLocaleString()} violations
            </span>
          )}
          {!loading && error && (
            <span className="trends-config__status trends-config__status--err">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrendsDashboard() {
  const [zoneOptions, setZoneOptions] = useState([]);
  const [dateBounds, setDateBounds] = useState({ min: "2023-11-01", max: "2024-04-30" });
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedA, setSelectedA] = useState([]);
  const [dateModeA, setDateModeA] = useState("all");
  const [singleDateA, setSingleDateA] = useState("");
  const [startDateA, setStartDateA] = useState("");
  const [endDateA, setEndDateA] = useState("");
  const [presetA, setPresetA] = useState("all");
  const [dataA, setDataA] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [errorA, setErrorA] = useState(null);

  const [selectedB, setSelectedB] = useState([]);
  const [dateModeB, setDateModeB] = useState("all");
  const [singleDateB, setSingleDateB] = useState("");
  const [startDateB, setStartDateB] = useState("");
  const [endDateB, setEndDateB] = useState("");
  const [presetB, setPresetB] = useState("all");
  const [dataB, setDataB] = useState(null);
  const [loadingB, setLoadingB] = useState(false);
  const [errorB, setErrorB] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [hotspots, range] = await Promise.all([getHotspots(), getDateRange()]);
        const opts = hotspots.map((h) => ({ value: h.zone_id, label: h.zone_name }));
        setZoneOptions(opts);
        setDateBounds({ min: range.min_date, max: range.max_date });
        if (opts.length > 0) {
          setSelectedA([opts[0].value]);
          setSelectedB([opts.length > 1 ? opts[1].value : opts[0].value]);
        }
        setSingleDateA(range.min_date);
        setStartDateA(range.min_date);
        setEndDateA(range.max_date);
        setSingleDateB(range.min_date);
        setStartDateB(range.min_date);
        setEndDateB(range.max_date);
      } catch (err) {
        console.error("Failed to initialize trends dashboard:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    init();
  }, []);

  const loadAndAggregate = async (zoneIds, mode, singleVal, startVal, endVal, setData, setLoading, setError) => {
    if (zoneIds.length === 0) { setData(null); return; }
    setLoading(true);
    setError(null);

    let startParam = null;
    let endParam = null;
    if (mode === "single") { startParam = singleVal; endParam = singleVal; }
    else if (mode === "range") { startParam = startVal; endParam = endVal; }

    try {
      const results = (await Promise.all(
        zoneIds.map((id) => getHotspotDetail(id, startParam, endParam))
      )).filter((r) => r?.zone_id !== undefined);

      if (!results.length) { setData(null); setError("No data for selected zones."); return; }

      const totalViolations = results.reduce((s, z) => s + (z.total_violations || 0), 0);
      const avgImpact = results.reduce((s, z) => s + (z.impact_score || 0), 0) / results.length;
      const avgResolution = results.reduce((s, z) => s + (z.avg_resolution_time || 0), 0) / results.length;
      const avgJunction = results.reduce((s, z) => s + (z.junction_ratio || 0), 0) / results.length;

      const hourly = {};
      for (let h = 0; h < 24; h++) hourly[h] = 0;
      results.forEach((z) => {
        Object.entries(z.hourly_distribution || {}).forEach(([hs, c]) => {
          const hr = Math.floor(parseFloat(hs));
          if (hr >= 0 && hr < 24) hourly[hr] += c;
        });
      });

      const vehicles = {};
      VEHICLES.forEach((v) => { vehicles[v] = 0; });
      results.forEach((z) => {
        Object.entries(z.vehicle_distribution || {}).forEach(([vt, c]) => {
          vehicles[VEHICLES.includes(vt) ? vt : "OTHERS"] += c;
        });
      });

      const violationTypes = {};
      results.forEach((z) => {
        Object.entries(z.violation_types || {}).forEach(([vt, c]) => {
          violationTypes[vt] = (violationTypes[vt] || 0) + c;
        });
      });

      setData({
        zoneCount: results.length,
        total_violations: totalViolations,
        impact_score: parseFloat(avgImpact.toFixed(1)),
        avg_resolution_time: parseFloat(avgResolution.toFixed(1)),
        junction_ratio: avgJunction,
        hourly_distribution: hourly,
        vehicle_distribution: vehicles,
        top_violation_types: Object.entries(violationTypes)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      });
    } catch {
      setError("Failed to fetch data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAndAggregate(selectedA, dateModeA, singleDateA, startDateA, endDateA, setDataA, setLoadingA, setErrorA);
  }, [selectedA, dateModeA, singleDateA, startDateA, endDateA]);

  useEffect(() => {
    loadAndAggregate(selectedB, dateModeB, singleDateB, startDateB, endDateB, setDataB, setLoadingB, setErrorB);
  }, [selectedB, dateModeB, singleDateB, startDateB, endDateB]);

  const makeApplyPreset = (side) => (presetName, start, end) => {
    const setPreset = side === "A" ? setPresetA : setPresetB;
    const setMode = side === "A" ? setDateModeA : setDateModeB;
    const setStart = side === "A" ? setStartDateA : setStartDateB;
    const setEnd = side === "A" ? setEndDateA : setEndDateB;

    setPreset(presetName);
    setMode(presetName === "all" ? "all" : "range");
    if (start) { setStart(start); setEnd(end); }
  };

  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    "Side A": dataA ? (dataA.hourly_distribution[h] || 0) : 0,
    "Side B": dataB ? (dataB.hourly_distribution[h] || 0) : 0,
  }));

  const vehicleData = VEHICLES.map((v) => ({
    name: v,
    "Side A": dataA ? (dataA.vehicle_distribution[v] || 0) : 0,
    "Side B": dataB ? (dataB.vehicle_distribution[v] || 0) : 0,
  }));

  const kpis = [
    { icon: AlertTriangle, label: "Total violations", valA: dataA?.total_violations?.toLocaleString(), valB: dataB?.total_violations?.toLocaleString() },
    { icon: TrendingUp, label: "Avg impact score", valA: dataA?.impact_score, valB: dataB?.impact_score },
    { icon: Clock, label: "Resolution (hrs)", valA: dataA?.avg_resolution_time, valB: dataB?.avg_resolution_time },
    { icon: ShieldCheck, label: "Junction proximity", valA: dataA ? `${(dataA.junction_ratio * 100).toFixed(1)}%` : null, valB: dataB ? `${(dataB.junction_ratio * 100).toFixed(1)}%` : null },
  ];

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
      <div className="section-head">
        <div>
          <span className="overline">◉ Trends &amp; comparison</span>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>Compare zones across time.</h2>
          <p>
            Stack two configurations — zones plus date windows — and read violation rhythm,
            vehicle mix, and enforcement pressure side by side.
          </p>
        </div>
        <div className="trends-legend-key">
          <span><i style={{ background: SIDE_A_COLOR }} /> Arm A · Cubbon Green</span>
          <span><i style={{ background: SIDE_B_COLOR }} /> Arm B · Sandalwood</span>
        </div>
      </div>

      <div className="trends-config-grid stagger">
        <ConfigPanel
          side="A"
          accent={SIDE_A_COLOR}
          accentClass="a"
          zoneOptions={zoneOptions}
          selected={selectedA}
          onSelect={setSelectedA}
          dateMode={dateModeA}
          setDateMode={(m) => { setDateModeA(m); if (m === "all") setPresetA("all"); else setPresetA("custom"); }}
          singleDate={singleDateA}
          setSingleDate={(v) => { setSingleDateA(v); setPresetA("custom"); }}
          startDate={startDateA}
          setStartDate={(v) => { setStartDateA(v); setPresetA("custom"); }}
          endDate={endDateA}
          setEndDate={(v) => { setEndDateA(v); setPresetA("custom"); }}
          preset={presetA}
          applyPreset={makeApplyPreset("A")}
          dateBounds={dateBounds}
          loading={loadingA}
          data={dataA}
          error={errorA}
        />
        <div className="trends-vs-badge" aria-hidden="true">
          <GitCompare size={18} />
        </div>
        <ConfigPanel
          side="B"
          accent={SIDE_B_COLOR}
          accentClass="b"
          zoneOptions={zoneOptions}
          selected={selectedB}
          onSelect={setSelectedB}
          dateMode={dateModeB}
          setDateMode={(m) => { setDateModeB(m); if (m === "all") setPresetB("all"); else setPresetB("custom"); }}
          singleDate={singleDateB}
          setSingleDate={(v) => { setSingleDateB(v); setPresetB("custom"); }}
          startDate={startDateB}
          setStartDate={(v) => { setStartDateB(v); setPresetB("custom"); }}
          endDate={endDateB}
          setEndDate={(v) => { setEndDateB(v); setPresetB("custom"); }}
          preset={presetB}
          applyPreset={makeApplyPreset("B")}
          dateBounds={dateBounds}
          loading={loadingB}
          data={dataB}
          error={errorB}
        />
      </div>

      <div className="trends-kpi-grid stagger">
        {kpis.map(({ icon: Icon, label, valA, valB }, i) => (
          <div key={i} className="card card-pad trends-kpi">
            <div className="trends-kpi__label">
              <Icon size={14} />
              <span>{label}</span>
            </div>
            <div className="trends-kpi__compare">
              <div className="trends-kpi__val trends-kpi__val--a">
                {loadingA ? "…" : (valA ?? "—")}
              </div>
              <span className="trends-kpi__vs">vs</span>
              <div className="trends-kpi__val trends-kpi__val--b">
                {loadingB ? "…" : (valB ?? "—")}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="trends-charts stagger">
        <div className="card card-pad">
          <div className="trends-chart-head">
            <div>
              <span className="overline">24-hour rhythm</span>
              <h3>Hourly violation distribution</h3>
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
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Side A" stroke={SIDE_A_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: SIDE_A_COLOR }} />
                <Line type="monotone" dataKey="Side B" stroke={SIDE_B_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: SIDE_B_COLOR }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <div className="trends-chart-head">
            <div>
              <span className="overline">Fleet profile</span>
              <h3>Vehicle type breakdown</h3>
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

      <div className="trends-violations stagger">
        {[
          { data: dataA, loading: loadingA, error: errorA, side: "A", accent: SIDE_A_COLOR, accentClass: "a" },
          { data: dataB, loading: loadingB, error: errorB, side: "B", accent: SIDE_B_COLOR, accentClass: "b" },
        ].map(({ data, loading, error, side, accent, accentClass }) => (
          <div key={side} className="card card-pad">
            <div className="trends-violations__head">
              <span className={`trends-side-badge trends-side-badge--${accentClass}`}>{side}</span>
              <h3>Top violation categories</h3>
            </div>
            {loading && <p className="trends-empty">Loading categories…</p>}
            {error && <p className="trends-empty trends-empty--err">{error}</p>}
            {!data && !loading && !error && (
              <p className="trends-empty">Select zones to see categories.</p>
            )}
            {data && (
              <ol className="trends-violation-list">
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
    </div>
  );
}
