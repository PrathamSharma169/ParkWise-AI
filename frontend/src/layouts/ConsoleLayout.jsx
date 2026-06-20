import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "@/components/TopNav";
import DateSelector from "@/components/DateSelector";
import { ROUTES } from "@/constants/routes";

export default function ConsoleLayout() {
  const location = useLocation();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const showDateSelector = location.pathname !== ROUTES.trends;

  return (
    <div className="app-shell" data-testid="app-shell">
      <TopNav />
      {showDateSelector && (
        <DateSelector
          onFilterChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet context={{ startDate, endDate }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
