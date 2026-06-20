import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatScopeShortLabel } from "@/utils/useTemporalScope";

const PANEL_WIDTH = 320;

function parseYmd(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a, b) {
  return a && b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isBetween(day, from, to) {
  if (!from || !to) return false;
  const t = day.getTime();
  return t > from.getTime() && t < to.getTime();
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function NavDatePicker({
  startDate,
  endDate,
  minDate = "2023-11-01",
  maxDate = "2024-04-30",
  onApply,
  onClear,
}) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [viewMonth, setViewMonth] = useState(() => parseYmd(startDate) || parseYmd(minDate) || new Date());
  const [draftFrom, setDraftFrom] = useState(null);
  const [draftTo, setDraftTo] = useState(null);

  const min = useMemo(() => parseYmd(minDate), [minDate]);
  const max = useMemo(() => parseYmd(maxDate), [maxDate]);
  const isActive = Boolean(startDate || endDate);
  const activeLabel = formatScopeShortLabel(startDate, endDate);
  const triggerLabel = isActive ? activeLabel : "Dates";
  const tooltipText = isActive
    ? `Showing ${activeLabel} · Click to change`
    : "Filter map and dashboards by date";

  useEffect(() => {
    if (!open) return;
    setDraftFrom(parseYmd(startDate));
    setDraftTo(parseYmd(endDate));
    setViewMonth(parseYmd(startDate) || parseYmd(minDate) || new Date());
  }, [open, startDate, endDate, minDate]);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8));
    setPanelPos({ top: rect.bottom + 10, left });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePanelPosition();

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, viewMonth, isActive, activeLabel]);

  const monthDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startPad; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [viewMonth]);

  function isDisabled(day) {
    if (!day) return true;
    const t = startOfDay(day).getTime();
    return t < startOfDay(min).getTime() || t > startOfDay(max).getTime();
  }

  function handleDayClick(day) {
    if (isDisabled(day)) return;

    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(day);
      setDraftTo(null);
      return;
    }

    if (day.getTime() < draftFrom.getTime()) {
      setDraftFrom(day);
      setDraftTo(null);
    } else {
      setDraftTo(day);
    }
  }

  function handleApply() {
    if (!draftFrom) return;
    const start = formatYmd(draftFrom);
    const end = formatYmd(draftTo || draftFrom);
    onApply(start, end);
    setOpen(false);
  }

  function handleClear() {
    setDraftFrom(null);
    setDraftTo(null);
    onClear();
    setOpen(false);
  }

  function prevMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  }

  const monthLabel = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const overlay = open && createPortal(
    <>
      <button
        type="button"
        className="nav-date-picker__backdrop"
        aria-label="Close calendar"
        onClick={() => setOpen(false)}
      />
      <div
        className="nav-date-picker__panel nav-date-picker__panel--portal"
        data-testid="nav-date-picker-panel"
        style={{ top: panelPos.top, left: panelPos.left }}
      >
        <p className="nav-date-picker__title">Filter by date</p>

        <div className="nav-date-picker__header">
          <button type="button" className="nav-date-picker__nav" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span className="nav-date-picker__month">{monthLabel}</span>
          <button type="button" className="nav-date-picker__nav" onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="nav-date-picker__weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="nav-date-picker__grid">
          {monthDays.map((day, i) => {
            if (!day) {
              return <span key={`empty-${i}`} className="nav-date-picker__day nav-date-picker__day--empty" />;
            }

            const selectedStart = isSameDay(day, draftFrom);
            const selectedEnd = isSameDay(day, draftTo);
            const inRange = isBetween(day, draftFrom, draftTo);
            const disabled = isDisabled(day);

            return (
              <button
                key={formatYmd(day)}
                type="button"
                disabled={disabled}
                className={[
                  "nav-date-picker__day",
                  selectedStart && "nav-date-picker__day--start",
                  selectedEnd && "nav-date-picker__day--end",
                  inRange && "nav-date-picker__day--in-range",
                  disabled && "nav-date-picker__day--disabled",
                ].filter(Boolean).join(" ")}
                onClick={() => handleDayClick(day)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <div className="nav-date-picker__actions">
          <button type="button" className="btn btn-ghost nav-date-picker__clear" onClick={handleClear}>
            Clear
          </button>
          <button
            type="button"
            className="btn btn-primary nav-date-picker__apply"
            onClick={handleApply}
            disabled={!draftFrom}
          >
            Apply filter
          </button>
        </div>
      </div>
    </>,
    document.body,
  );

  return (
    <div className="nav-date-picker" data-testid="nav-date-picker">
      <button
        ref={triggerRef}
        type="button"
        className={`nav-date-picker__trigger ${isActive ? "nav-date-picker__trigger--active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={tooltipText}
        title={tooltipText}
        aria-expanded={open}
        data-testid="nav-date-picker-trigger"
      >
        <Calendar size={16} strokeWidth={2.2} aria-hidden="true" />
        {isActive && <span className="nav-date-picker__dot" aria-hidden="true" />}
        <span className={`nav-date-picker__label ${isActive ? "nav-date-picker__label--active" : ""}`}>
          {triggerLabel}
        </span>
        <ChevronDown size={14} className="nav-date-picker__chevron" aria-hidden="true" />
      </button>
      {overlay}
    </div>
  );
}
