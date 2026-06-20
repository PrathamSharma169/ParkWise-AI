import React, { useEffect, useMemo, useState } from "react";
import { getDateRange } from "@/utils/api";
import { Calendar, Clock, ChevronRight, Filter, ChevronUp } from "lucide-react";

const PRESETS = [
  { key: "all", label: "All time" },
  { key: "nov23", label: "Nov 2023", start: "2023-11-01", end: "2023-11-30" },
  { key: "dec23", label: "Dec 2023", start: "2023-12-01", end: "2023-12-31" },
  { key: "mar24", label: "Mar 2024", start: "2024-03-01", end: "2024-03-31" },
  { key: "apr24", label: "Apr 2024", start: "2024-04-01", end: "2024-04-30" },
];

function formatLabel(dateStr) {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DateSelector({ onFilterChange, onCollapse }) {
  const [bounds, setBounds] = useState({ min: "2023-11-01", max: "2024-04-30" });
  const [filterMode, setFilterMode] = useState("all");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState("all");

  useEffect(() => {
    async function loadBounds() {
      try {
        const range = await getDateRange();
        setBounds({ min: range.min_date, max: range.max_date });
        setSingleDate(range.min_date);
        setStartDate(range.min_date);
        setEndDate(range.max_date);
      } catch (e) {
        console.error("Failed to load date boundaries:", e);
      }
    }
    loadBounds();
  }, []);

  useEffect(() => {
    if (filterMode === "all") {
      onFilterChange(null, null);
    } else if (filterMode === "single" && singleDate) {
      onFilterChange(singleDate, singleDate);
    } else if (filterMode === "range" && startDate && endDate) {
      onFilterChange(startDate, endDate);
    }
  }, [filterMode, singleDate, startDate, endDate]);

  const applyPreset = (preset) => {
    setActivePreset(preset.key);
    if (preset.key === "all") {
      setFilterMode("all");
      return;
    }
    setFilterMode("range");
    setStartDate(preset.start);
    setEndDate(preset.end);
  };

  const handleModeChange = (mode) => {
    setFilterMode(mode);
    setActivePreset(mode === "all" ? "all" : "custom");
  };

  const activeSummary = useMemo(() => {
    if (filterMode === "all") return "Full dataset · all recorded violations";
    if (filterMode === "single" && singleDate) {
      return `Single day · ${formatLabel(singleDate)}`;
    }
    if (filterMode === "range" && startDate && endDate) {
      return `${formatLabel(startDate)} → ${formatLabel(endDate)}`;
    }
    return "Select a date range";
  }, [filterMode, singleDate, startDate, endDate]);

  return (
    <div className="date-filter" data-testid="date-filter">
      <div className="date-filter__head">
        <div className="date-filter__title">
          <Filter size={14} strokeWidth={2.2} />
          <div>
            <span className="overline">Temporal filter</span>
            <p className="date-filter__summary">{activeSummary}</p>
          </div>
        </div>

        <div className="date-filter__head-actions">
          {onCollapse && (
            <button
              type="button"
              className="btn btn-ghost date-filter__collapse"
              onClick={onCollapse}
              data-testid="collapse-dates-btn"
            >
              Collapse
              <ChevronUp size={14} />
            </button>
          )}
          <div className="nav-pills date-filter__modes" role="tablist" aria-label="Date filter mode">
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === "all"}
              className={`nav-pill ${filterMode === "all" ? "active" : ""}`}
              onClick={() => handleModeChange("all")}
            >
              <Clock size={14} />
              Full dataset
            </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterMode === "single"}
            className={`nav-pill ${filterMode === "single" ? "active" : ""}`}
            onClick={() => handleModeChange("single")}
          >
            <Calendar size={14} />
            Single day
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterMode === "range"}
            className={`nav-pill ${filterMode === "range" ? "active" : ""}`}
            onClick={() => handleModeChange("range")}
          >
            <Calendar size={14} />
            Date range
          </button>
          </div>
        </div>
      </div>

      <p className="date-filter__helper">
        All maps, rankings, and severity colors recalculate for the selected period.
      </p>

      <div className="date-filter__body">
        {filterMode === "single" && (
          <div className="date-filter__inputs date-filter__inputs--single">
            <label className="date-filter__label" htmlFor="date-single">Select date</label>
            <input
              id="date-single"
              type="date"
              value={singleDate}
              min={bounds.min}
              max={bounds.max}
              onChange={(e) => {
                setSingleDate(e.target.value);
                setActivePreset("custom");
              }}
              className="date-filter__input"
            />
          </div>
        )}

        {filterMode === "range" && (
          <div className="date-filter__inputs date-filter__inputs--range">
            <div className="date-filter__field">
              <label className="date-filter__label" htmlFor="date-from">From</label>
              <input
                id="date-from"
                type="date"
                value={startDate}
                min={bounds.min}
                max={bounds.max}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset("custom");
                }}
                className="date-filter__input"
              />
            </div>
            <ChevronRight size={14} className="date-filter__sep" aria-hidden="true" />
            <div className="date-filter__field">
              <label className="date-filter__label" htmlFor="date-to">To</label>
              <input
                id="date-to"
                type="date"
                value={endDate}
                min={bounds.min}
                max={bounds.max}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset("custom");
                }}
                className="date-filter__input"
              />
            </div>
          </div>
        )}

        <div className="date-filter__presets" role="group" aria-label="Quick presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`date-preset ${activePreset === preset.key ? "date-preset--active" : ""}`}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
