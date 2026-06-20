import React, { useState, useEffect } from 'react';
import { getHotspots, getHotspotDetail, getDateRange } from '../utils/api';
import MultiSelectDropdown from './MultiSelectDropdown';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

const VEHICLES = ['BIKE', 'CAR', 'AUTO', 'MAXI CAB', 'BUS', 'TRUCK', 'OTHERS'];

const SIDE_A_COLOR = '#3b82f6';
const SIDE_B_COLOR = '#a855f7';

function DateControls({ side, dateMode, setDateMode, singleDate, setSingleDate, startDate, setStartDate, endDate, setEndDate, preset, applyPreset, dateBounds }) {
  const presets = [
    { key: 'nov23', label: "Nov '23", start: '2023-11-01', end: '2023-11-30' },
    { key: 'dec23', label: "Dec '23", start: '2023-12-01', end: '2023-12-31' },
    { key: 'mar24', label: "Mar '24", start: '2024-03-01', end: '2024-03-31' },
    { key: 'apr24', label: "Apr '24", start: '2024-04-01', end: '2024-04-30' },
  ];

  return (
    <div className="date-controls">
      <div className="date-mode-tabs">
        {['all', 'single', 'range'].map(mode => (
          <button
            key={mode}
            className={`date-tab ${dateMode === mode ? 'date-tab--active' : ''}`}
            onClick={() => setDateMode(mode)}
          >
            {mode === 'all' ? 'All time' : mode === 'single' ? 'Single day' : 'Date range'}
          </button>
        ))}
      </div>

      {dateMode === 'single' && (
        <div className="date-input-row">
          <input
            type="date"
            value={singleDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setSingleDate(e.target.value)}
            className="date-input"
          />
        </div>
      )}

      {dateMode === 'range' && (
        <div className="date-input-row date-input-row--range">
          <input
            type="date"
            value={startDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
          <ArrowRight size={14} className="date-arrow" />
          <input
            type="date"
            value={endDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>
      )}

      <div className="preset-chips">
        <button
          className={`preset-chip ${preset === 'all' ? 'preset-chip--active' : ''}`}
          onClick={() => applyPreset(side, 'all', null, null)}
        >
          All
        </button>
        {presets.map(p => (
          <button
            key={p.key}
            className={`preset-chip ${preset === p.key ? 'preset-chip--active' : ''}`}
            onClick={() => applyPreset(side, p.key, p.start, p.end)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: p.color }} />
          <span className="chart-tooltip__name">{p.name}</span>
          <span className="chart-tooltip__value">{(p.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function TrendsDashboard() {
  const [zoneOptions, setZoneOptions] = useState([]);
  const [dateBounds, setDateBounds] = useState({ min: '2023-11-01', max: '2024-04-30' });
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedA, setSelectedA] = useState([]);
  const [dateModeA, setDateModeA] = useState('all');
  const [singleDateA, setSingleDateA] = useState('');
  const [startDateA, setStartDateA] = useState('');
  const [endDateA, setEndDateA] = useState('');
  const [presetA, setPresetA] = useState('all');
  const [dataA, setDataA] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [errorA, setErrorA] = useState(null);

  const [selectedB, setSelectedB] = useState([]);
  const [dateModeB, setDateModeB] = useState('all');
  const [singleDateB, setSingleDateB] = useState('');
  const [startDateB, setStartDateB] = useState('');
  const [endDateB, setEndDateB] = useState('');
  const [presetB, setPresetB] = useState('all');
  const [dataB, setDataB] = useState(null);
  const [loadingB, setLoadingB] = useState(false);
  const [errorB, setErrorB] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const [hotspots, range] = await Promise.all([getHotspots(), getDateRange()]);
        const opts = hotspots.map(h => ({ value: h.zone_id, label: h.zone_name }));
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
        console.error('Failed to initialize trends dashboard:', err);
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

    let startParam = null, endParam = null;
    if (mode === 'single') { startParam = singleVal; endParam = singleVal; }
    else if (mode === 'range') { startParam = startVal; endParam = endVal; }

    try {
      const results = (await Promise.all(zoneIds.map(id => getHotspotDetail(id, startParam, endParam)))).filter(r => r?.zone_id !== undefined);
      if (!results.length) { setData(null); setError('No data for selected zones.'); return; }

      const totalViolations = results.reduce((s, z) => s + (z.total_violations || 0), 0);
      const avgImpact = results.reduce((s, z) => s + (z.impact_score || 0), 0) / results.length;
      const avgResolution = results.reduce((s, z) => s + (z.avg_resolution_time || 0), 0) / results.length;
      const avgJunction = results.reduce((s, z) => s + (z.junction_ratio || 0), 0) / results.length;

      const hourly = {};
      for (let h = 0; h < 24; h++) hourly[h] = 0;
      results.forEach(z => Object.entries(z.hourly_distribution || {}).forEach(([hs, c]) => {
        const hr = Math.floor(parseFloat(hs));
        if (hr >= 0 && hr < 24) hourly[hr] += c;
      }));

      const vehicles = {};
      VEHICLES.forEach(v => { vehicles[v] = 0; });
      results.forEach(z => Object.entries(z.vehicle_distribution || {}).forEach(([vt, c]) => {
        vehicles[VEHICLES.includes(vt) ? vt : 'OTHERS'] += c;
      }));

      const violationTypes = {};
      results.forEach(z => Object.entries(z.violation_types || {}).forEach(([vt, c]) => {
        violationTypes[vt] = (violationTypes[vt] || 0) + c;
      }));

      setData({
        names: results.map(r => r.zone_name).join(', '),
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
    } catch (err) {
      setError('Failed to fetch data.'); setData(null);
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

  const applyPreset = (side, presetName, start, end) => {
    if (side === 'A') {
      setPresetA(presetName);
      setDateModeA(presetName === 'all' ? 'all' : 'range');
      if (start) { setStartDateA(start); setEndDateA(end); }
    } else {
      setPresetB(presetName);
      setDateModeB(presetName === 'all' ? 'all' : 'range');
      if (start) { setStartDateB(start); setEndDateB(end); }
    }
  };

  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}:00`,
    'Side A': dataA ? (dataA.hourly_distribution[h] || 0) : 0,
    'Side B': dataB ? (dataB.hourly_distribution[h] || 0) : 0,
  }));

  const vehicleData = VEHICLES.map(v => ({
    name: v,
    'Side A': dataA ? (dataA.vehicle_distribution[v] || 0) : 0,
    'Side B': dataB ? (dataB.vehicle_distribution[v] || 0) : 0,
  }));

  const kpis = [
    { icon: AlertTriangle, label: 'Total Violations', valA: dataA?.total_violations?.toLocaleString(), valB: dataB?.total_violations?.toLocaleString() },
    { icon: TrendingUp, label: 'Avg Impact Score', valA: dataA?.impact_score, valB: dataB?.impact_score },
    { icon: Clock, label: 'Resolution (hrs)', valA: dataA?.avg_resolution_time, valB: dataB?.avg_resolution_time },
    { icon: ShieldCheck, label: 'Junction Proximity', valA: dataA ? `${(dataA.junction_ratio * 100).toFixed(1)}%` : null, valB: dataB ? `${(dataB.junction_ratio * 100).toFixed(1)}%` : null },
  ];

  if (loadingOptions) {
    return (
      <div className="trends-loading">
        <div className="trends-loading__spinner" />
        <span>Loading comparison data…</span>
      </div>
    );
  }

  return (
    <div className="trends-page">

      {/* Page Header */}
      <div className="trends-header">
        <div className="trends-header__text">
          <h2>Zone Comparison</h2>
          <p>Compare violation patterns, peak hours, and vehicle profiles across zones or time periods.</p>
        </div>
      </div>

      {/* Config Panels */}
      <div className="config-grid">
        {/* Side A */}
        <div className="config-panel config-panel--a">
          <div className="config-panel__stripe config-panel__stripe--a" />
          <div className="config-panel__inner">
            <div className="config-panel__label">
              <span className="side-badge side-badge--a">A</span>
              <span className="config-panel__title">Configuration A</span>
            </div>

            <div className="field-group">
              <label className="field-label">Zones</label>
              <MultiSelectDropdown
                options={zoneOptions}
                selected={selectedA}
                onChange={setSelectedA}
                placeholder="Select zones…"
                accentColor={SIDE_A_COLOR}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Time Period</label>
              <DateControls
                side="A"
                dateMode={dateModeA}
                setDateMode={(m) => { setDateModeA(m); if (m === 'all') setPresetA('all'); }}
                singleDate={singleDateA}
                setSingleDate={(v) => { setSingleDateA(v); setPresetA('custom'); }}
                startDate={startDateA}
                setStartDate={(v) => { setStartDateA(v); setPresetA('custom'); }}
                endDate={endDateA}
                setEndDate={(v) => { setEndDateA(v); setPresetA('custom'); }}
                preset={presetA}
                applyPreset={applyPreset}
                dateBounds={dateBounds}
              />
            </div>

            {selectedA.length > 0 && (
              <div className="config-panel__summary">
                {loadingA ? (
                  <span className="summary-loading">Fetching data…</span>
                ) : dataA ? (
                  <span className="summary-text">{dataA.zoneCount} zone{dataA.zoneCount > 1 ? 's' : ''} · {dataA.total_violations.toLocaleString()} violations</span>
                ) : errorA ? (
                  <span className="summary-error">{errorA}</span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Side B */}
        <div className="config-panel config-panel--b">
          <div className="config-panel__stripe config-panel__stripe--b" />
          <div className="config-panel__inner">
            <div className="config-panel__label">
              <span className="side-badge side-badge--b">B</span>
              <span className="config-panel__title">Configuration B</span>
            </div>

            <div className="field-group">
              <label className="field-label">Zones</label>
              <MultiSelectDropdown
                options={zoneOptions}
                selected={selectedB}
                onChange={setSelectedB}
                placeholder="Select zones…"
                accentColor={SIDE_B_COLOR}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Time Period</label>
              <DateControls
                side="B"
                dateMode={dateModeB}
                setDateMode={(m) => { setDateModeB(m); if (m === 'all') setPresetB('all'); }}
                singleDate={singleDateB}
                setSingleDate={(v) => { setSingleDateB(v); setPresetB('custom'); }}
                startDate={startDateB}
                setStartDate={(v) => { setStartDateB(v); setPresetB('custom'); }}
                endDate={endDateB}
                setEndDate={(v) => { setEndDateB(v); setPresetB('custom'); }}
                preset={presetB}
                applyPreset={applyPreset}
                dateBounds={dateBounds}
              />
            </div>

            {selectedB.length > 0 && (
              <div className="config-panel__summary">
                {loadingB ? (
                  <span className="summary-loading">Fetching data…</span>
                ) : dataB ? (
                  <span className="summary-text">{dataB.zoneCount} zone{dataB.zoneCount > 1 ? 's' : ''} · {dataB.total_violations.toLocaleString()} violations</span>
                ) : errorB ? (
                  <span className="summary-error">{errorB}</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Comparison Bar */}
      <div className="kpi-strip">
        {kpis.map(({ icon: Icon, label, valA, valB }, i) => (
          <div key={i} className="kpi-item">
            <div className="kpi-item__header">
              <Icon size={13} />
              <span>{label}</span>
            </div>
            <div className="kpi-item__values">
              <div className="kpi-val kpi-val--a">
                {loadingA ? <span className="kpi-skeleton" /> : (valA ?? '—')}
              </div>
              <div className="kpi-vs">vs</div>
              <div className="kpi-val kpi-val--b">
                {loadingB ? <span className="kpi-skeleton" /> : (valB ?? '—')}
              </div>
            </div>
            <div className="kpi-item__labels">
              <span style={{ color: SIDE_A_COLOR }}>A</span>
              <span style={{ color: SIDE_B_COLOR }}>B</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Hourly violation distribution</h3>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: SIDE_A_COLOR }} />A
              <span className="legend-dot" style={{ background: SIDE_B_COLOR }} />B
            </div>
          </div>
          <div className="chart-card__body">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={hourlyData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Side A" stroke={SIDE_A_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Side B" stroke={SIDE_B_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card__header">
            <h3>Vehicle type breakdown</h3>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: SIDE_A_COLOR }} />A
              <span className="legend-dot" style={{ background: SIDE_B_COLOR }} />B
            </div>
          </div>
          <div className="chart-card__body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={vehicleData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Side A" fill={SIDE_A_COLOR} radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Bar dataKey="Side B" fill={SIDE_B_COLOR} radius={[3, 3, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Violation Type Lists */}
      <div className="violation-lists">
        {[{ data: dataA, loading: loadingA, error: errorA, color: SIDE_A_COLOR, label: 'A' },
        { data: dataB, loading: loadingB, error: errorB, color: SIDE_B_COLOR, label: 'B' }].map(({ data, loading, error, color, label }) => (
          <div key={label} className="violation-card">
            <div className="violation-card__header">
              <span className="side-badge" style={{ background: `${color}20`, color: color, border: `1px solid ${color}40` }}>{label}</span>
              <h3>Top violation categories</h3>
            </div>
            <div className="violation-card__body">
              {loading && <div className="violation-empty">Loading…</div>}
              {error && <div className="violation-error">{error}</div>}
              {!data && !loading && !error && (
                <div className="violation-empty">Select zones to see categories</div>
              )}
              {data && (
                <ol className="violation-list">
                  {data.top_violation_types.map((v, i) => {
                    const max = data.top_violation_types[0]?.count || 1;
                    const pct = (v.count / max) * 100;
                    return (
                      <li key={i} className="violation-item">
                        <div className="violation-item__top">
                          <span className="violation-rank" style={{ color }}>{String(i + 1).padStart(2, '0')}</span>
                          <span className="violation-name">{v.type}</span>
                          <span className="violation-count" style={{ color }}>{v.count.toLocaleString()}</span>
                        </div>
                        <div className="violation-bar-track">
                          <div className="violation-bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}