import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import MapView from "@/components/MapView";
import CityDashboard from "@/components/CityDashboard";
import RecommendationPanel from "@/components/RecommendationPanel";
import AboutPage from "@/pages/AboutPage";
import ConsoleLayout from "@/layouts/ConsoleLayout";
import { ROUTES } from "@/constants/routes";

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
        <Route path={ROUTES.map} element={<MapView />} />
        <Route path={ROUTES.dashboard} element={<CityDashboard />} />
        <Route path={ROUTES.recommendations} element={<RecommendationPanel />} />
        <Route path={ROUTES.about} element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
