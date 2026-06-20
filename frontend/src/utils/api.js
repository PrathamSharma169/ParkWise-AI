/**
 * ParkWise AI - API Client
 * Routes through REACT_APP_BACKEND_URL for local and deployed environments.
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API_BASE = `${BACKEND_URL.replace(/\/$/, "")}/api`;

async function fetchJSON(url) {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function postJSON(url) {
  const res = await fetch(`${API_BASE}${url}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getHotspots() {
  return fetchJSON('/hotspots');
}

export async function getHotspotDetail(zoneId) {
  return fetchJSON(`/hotspot/${zoneId}`);
}

export async function getDensityMap() {
  return fetchJSON('/density-map');
}

export async function getImpactMap() {
  return fetchJSON('/impact-map');
}

export async function getAnalytics() {
  return fetchJSON('/analytics');
}

export async function getRecommendations() {
  return fetchJSON('/recommendations');
}

export async function getZoneRecommendation(zoneId) {
  return fetchJSON(`/recommendation/${zoneId}`);
}

export async function explainZoneRisk(zoneId) {
  return postJSON(`/recommendation/${zoneId}/explain`);
}
