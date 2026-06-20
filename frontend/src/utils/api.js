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

function buildQuery(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const str = params.toString();
  return str ? `?${str}` : '';
}

export async function getDateRange() {
  return fetchJSON('/date-range');
}

export async function getHotspots(startDate, endDate) {
  return fetchJSON(`/hotspots${buildQuery(startDate, endDate)}`);
}

export async function getHotspotDetail(zoneId, startDate, endDate) {
  return fetchJSON(`/hotspot/${zoneId}${buildQuery(startDate, endDate)}`);
}

export async function getDensityMap(startDate, endDate) {
  return fetchJSON(`/density-map${buildQuery(startDate, endDate)}`);
}

export async function getImpactMap(startDate, endDate) {
  return fetchJSON(`/impact-map${buildQuery(startDate, endDate)}`);
}

export async function getAnalytics(startDate, endDate) {
  return fetchJSON(`/analytics${buildQuery(startDate, endDate)}`);
}

export async function getRecommendations(startDate, endDate) {
  return fetchJSON(`/recommendations${buildQuery(startDate, endDate)}`);
}

export async function getZoneRecommendation(zoneId, startDate, endDate) {
  return fetchJSON(`/recommendation/${zoneId}${buildQuery(startDate, endDate)}`);
}

export async function explainZoneRisk(zoneId, startDate, endDate) {
  return postJSON(`/recommendation/${zoneId}/explain${buildQuery(startDate, endDate)}`);
}
