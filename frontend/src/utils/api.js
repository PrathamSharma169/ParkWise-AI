/**
 * ParkWise AI - API Client
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = '/api';

async function fetchJSON(url) {
  const res = await fetch(`${API_BASE}${url}`);
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
