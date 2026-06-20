import React from "react";
import { Routes, Route, Navigate, useOutletContext } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import MapView from "@/components/MapView";
import CityDashboard from "@/components/CityDashboard";
import RecommendationPanel from "@/components/RecommendationPanel";
import TrendsDashboard from "@/components/TrendsDashboard";
import AboutPage from "@/pages/AboutPage";
import ConsoleLayout from "@/layouts/ConsoleLayout";
import { ROUTES } from "@/constants/routes";

function MapPage() {
  const { startDate, endDate } = useOutletContext() || {};
  return <MapView startDate={startDate} endDate={endDate} />;
}

function DashboardPage() {
  const { startDate, endDate } = useOutletContext() || {};
  return <CityDashboard startDate={startDate} endDate={endDate} />;
}

function RecommendationsPage() {
  const { startDate, endDate } = useOutletContext() || {};
  return <RecommendationPanel startDate={startDate} endDate={endDate} />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path={ROUTES.home}
        element={
          <div className="app-shell" data-testid="app-shell">
            <LandingPage />
          </div>
        }
      />
      <Route element={<ConsoleLayout />}>
        <Route path={ROUTES.map} element={<MapPage />} />
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.recommendations} element={<RecommendationsPage />} />
        <Route path={ROUTES.trends} element={<TrendsDashboard />} />
        <Route path={ROUTES.about} element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
