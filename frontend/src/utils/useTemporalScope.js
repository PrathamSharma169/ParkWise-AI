import { useOutletContext } from "react-router-dom";

export function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isDateFiltered(startDate, endDate) {
  return Boolean(startDate || endDate);
}

/** Short label for page headlines, e.g. "Nov 2023" or "3 Nov 2023" */
export function formatScopeShortLabel(startDate, endDate) {
  if (!startDate && !endDate) return null;

  if (startDate && endDate && startDate === endDate) {
    return formatDateLabel(startDate);
  }

  if (startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (
      start.getMonth() === end.getMonth()
      && start.getFullYear() === end.getFullYear()
      && start.getDate() === 1
      && end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
    ) {
      return start.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    }
    return `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}`;
  }

  return formatDateLabel(startDate || endDate);
}

/** Full period string for banners */
export function formatScopePeriodLabel(startDate, endDate, dateBounds) {
  if (!isDateFiltered(startDate, endDate)) {
    const min = dateBounds?.min ? formatDateLabel(dateBounds.min) : "—";
    const max = dateBounds?.max ? formatDateLabel(dateBounds.max) : "—";
    return `Full dataset · ${min} – ${max}`;
  }

  if (startDate === endDate) {
    return formatDateLabel(startDate);
  }

  return `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}`;
}

export function formatPercentDelta(current, baseline) {
  if (baseline == null || baseline === 0) return null;
  const pct = ((current - baseline) / baseline) * 100;
  const rounded = Math.round(pct);
  if (rounded === 0) return "±0%";
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

export function buildScopeMeta({
  analytics,
  baseline,
  startDate,
  endDate,
  dateBounds,
  loading,
  error,
}) {
  const filtered = isDateFiltered(startDate, endDate);
  const totalViolations = analytics?.total_violations ?? 0;
  const totalZones = analytics?.total_zones ?? 0;
  const baselineViolations = baseline?.total_violations ?? 0;
  const baselineZones = baseline?.total_zones ?? 0;
  const avgImpact = analytics?.avg_impact_score ?? 0;
  const baselineAvgImpact = baseline?.avg_impact_score ?? 0;

  const violationDelta = filtered && baselineViolations > 0
    ? formatPercentDelta(totalViolations, baselineViolations)
    : null;

  const impactDelta = filtered && baselineAvgImpact > 0
    ? formatPercentDelta(avgImpact, baselineAvgImpact)
    : null;

  const empty = !loading && filtered && totalViolations === 0 && totalZones === 0;

  return {
    filtered,
    loading,
    error,
    empty,
    periodLabel: formatScopePeriodLabel(startDate, endDate, dateBounds),
    shortLabel: formatScopeShortLabel(startDate, endDate),
    totalViolations,
    totalZones,
    baselineViolations,
    baselineZones,
    avgImpact,
    violationDelta,
    impactDelta,
    chipText: filtered
      ? `${formatScopeShortLabel(startDate, endDate) || "Custom range"} · ${totalViolations.toLocaleString()} violations · ${totalZones} zones`
      : `Full dataset · ${totalViolations.toLocaleString()} violations · ${totalZones} zones`,
  };
}

export function useConsoleScope() {
  return useOutletContext() || {};
}

/** Headline helpers per page */
export function getMapHeadline(mode, scopeMeta) {
  if (!scopeMeta?.filtered) {
    return mode === "density"
      ? "Where the city breaks down."
      : "Which break down to fix first.";
  }
  const period = scopeMeta.shortLabel || "selected period";
  return mode === "density"
    ? `Where violations clustered · ${period}`
    : `Which zones to fix first · ${period}`;
}

export function getDashboardHeadline(scopeMeta) {
  if (!scopeMeta?.filtered) return "How Bengaluru is breathing today.";
  return `City pulse · ${scopeMeta.shortLabel || "selected period"}`;
}

export function getRecommendationsHeadline(total, scopeMeta) {
  if (!scopeMeta?.filtered) return `${total} zones. One queue.`;
  return `${total} zones in ${scopeMeta.shortLabel || "this period"}. One queue.`;
}

export function getScopeRhythmLabel(scopeMeta) {
  if (!scopeMeta?.filtered) return "Violation rhythm · 24-hour pattern";
  return `Violation rhythm · ${scopeMeta.shortLabel || "selected period"}`;
}

export function getBriefingScopeTag(scopeMeta) {
  if (!scopeMeta?.filtered) return null;
  return `${scopeMeta.shortLabel || "Filtered"} window`;
}
