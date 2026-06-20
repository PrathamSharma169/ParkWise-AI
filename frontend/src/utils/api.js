/**
 * ParkWise AI - API Client
 * Routes through REACT_APP_BACKEND_URL for local and deployed environments.
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API_BASE = `${BACKEND_URL.replace(/\/$/, "")}/api`;

/** Ping Render/backend on load so cold-start wake happens before user navigates. */
export function wakeBackend() {
  const base = BACKEND_URL.replace(/\/$/, "");
  if (/localhost|127\.0\.0\.1/i.test(base)) {
    return Promise.resolve(null);
  }
  return fetch(`${base}/`, { method: "GET" })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
}

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

export async function getTrendsMaxDate() {
  return fetchJSON("/trends/max-date");
}

export async function compareTrends(zoneA, zoneB, startHour, endHour) {
  return fetchJSON(`/trends/compare?zone_a=${zoneA}&zone_b=${zoneB}&start_hour=${startHour}&end_hour=${endHour}`);
}

export async function explainTrends(payload) {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const API_BASE = `${BACKEND_URL.replace(/\/$/, "")}/api`;
  const res = await fetch(`${API_BASE}/trends/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
