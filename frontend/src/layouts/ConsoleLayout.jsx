import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "@/components/TopNav";
import { ROUTES } from "@/constants/routes";
import { getAnalytics, getDateRange } from "@/utils/api";

export default function ConsoleLayout() {
  const location = useLocation();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateBounds, setDateBounds] = useState({ min: "2023-11-01", max: "2024-04-30" });
  const [analytics, setAnalytics] = useState(null);
  const [scopeLoading, setScopeLoading] = useState(true);

  const showDatePicker = location.pathname !== ROUTES.trends;

  useEffect(() => {
    getDateRange()
      .then((range) => setDateBounds({ min: range.min_date, max: range.max_date }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showDatePicker) return undefined;

    let cancelled = false;
    setScopeLoading(true);

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
          setScopeLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [startDate, endDate, showDatePicker]);

  const handleApplyDates = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleClearDates = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  const outletContext = useMemo(
    () => ({
      startDate,
      endDate,
      scopeLoading,
      analytics,
    }),
    [startDate, endDate, scopeLoading, analytics],
  );

  return (
    <div className="app-shell" data-testid="app-shell">
      <TopNav
        showDatePicker={showDatePicker}
        startDate={startDate}
        endDate={endDate}
        dateBounds={dateBounds}
        onApplyDates={handleApplyDates}
        onClearDates={handleClearDates}
      />
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
