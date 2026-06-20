import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "@/components/TopNav";
import DateSelector from "@/components/DateSelector";
import { ROUTES } from "@/constants/routes";
import { getAnalytics, getDateRange } from "@/utils/api";
import { buildScopeMeta } from "@/utils/useTemporalScope";
import { Calendar, ChevronDown } from "lucide-react";

export default function ConsoleLayout() {
  const location = useLocation();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateBounds, setDateBounds] = useState({ min: "2023-11-01", max: "2024-04-30" });
  const [analytics, setAnalytics] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [scopeLoading, setScopeLoading] = useState(true);
  const [scopeError, setScopeError] = useState(null);

  const showDateSelector = location.pathname !== ROUTES.trends;

  useEffect(() => {
    getDateRange()
      .then((range) => setDateBounds({ min: range.min_date, max: range.max_date }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAnalytics(null, null)
      .then((data) => { if (!cancelled) setBaseline(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!showDateSelector) return undefined;

    let cancelled = false;
    setScopeLoading(true);
    setScopeError(null);

    getAnalytics(startDate, endDate)
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data);
          setScopeLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnalytics(null);
          setScopeError(true);
          setScopeLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [startDate, endDate, showDateSelector]);

  const scopeMeta = useMemo(
    () => buildScopeMeta({
      analytics,
      baseline,
      startDate,
      endDate,
      dateBounds,
      loading: scopeLoading,
      error: scopeError,
    }),
    [analytics, baseline, startDate, endDate, dateBounds, scopeLoading, scopeError],
  );

  const outletContext = useMemo(
    () => ({
      startDate,
      endDate,
      scopeMeta,
      scopeLoading,
      analytics,
      baselineAnalytics: baseline,
      dateBounds,
    }),
    [startDate, endDate, scopeMeta, scopeLoading, analytics, baseline, dateBounds],
  );

  const handleFilterChange = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
    if (start || end) {
      setFilterExpanded(false);
    }
  }, []);

  return (
    <div className="app-shell" data-testid="app-shell">
      <TopNav />
      {showDateSelector && (
        <div className="date-filter-bar">
          <div className="date-filter-bar__inner">
            {!filterExpanded ? (
              <div className="date-scope-chip-row">
                <div className="date-scope-chip" data-testid="date-scope-chip">
                  <Calendar size={14} aria-hidden="true" />
                  <div className="date-scope-chip__text">
                    <span className="overline">Temporal scope</span>
                    <span className="date-scope-chip__value">
                      {scopeLoading ? "Loading scope…" : scopeMeta.chipText}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost date-scope-edit"
                  onClick={() => setFilterExpanded(true)}
                  data-testid="edit-dates-btn"
                >
                  Edit dates
                  <ChevronDown size={14} />
                </button>
              </div>
            ) : (
              <DateSelector
                onFilterChange={handleFilterChange}
                onCollapse={() => setFilterExpanded(false)}
              />
            )}
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet context={outletContext} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
