import React from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, AlertCircle, ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function TemporalScopeBanner({ scopeMeta, showTrendsLink = true }) {
  if (!scopeMeta) return null;

  const {
    loading,
    error,
    empty,
    filtered,
    periodLabel,
    totalViolations,
    totalZones,
    violationDelta,
  } = scopeMeta;

  if (loading) {
    return (
      <div className="temporal-scope-banner temporal-scope-banner--loading" data-testid="temporal-scope-banner">
        <LoaderCircle size={16} className="spin" aria-hidden="true" />
        <span>Recomputing zones for selected dates…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="temporal-scope-banner temporal-scope-banner--error" data-testid="temporal-scope-banner">
        <AlertCircle size={16} aria-hidden="true" />
        <span>Could not load data for this period. Try again or widen the date range.</span>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="temporal-scope-banner temporal-scope-banner--empty" data-testid="temporal-scope-banner">
        <AlertCircle size={16} aria-hidden="true" />
        <span>No violations in this period — widen the date range or choose Full dataset.</span>
      </div>
    );
  }

  return (
    <div className="temporal-scope-banner" data-testid="temporal-scope-banner">
      <div className="temporal-scope-banner__main">
        <span className="overline">Temporal scope</span>
        <p className="temporal-scope-banner__line">
          <strong>Analyzing {periodLabel}</strong>
          <span className="temporal-scope-banner__sep">·</span>
          <span>{totalViolations.toLocaleString()} violations</span>
          <span className="temporal-scope-banner__sep">·</span>
          <span>{totalZones} zones</span>
        </p>
        <p className="temporal-scope-banner__note">
          {filtered ? (
            <>
              {violationDelta && (
                <span>{violationDelta} violations vs full dataset · </span>
              )}
              Ranks &amp; colors rebaselined to this period.
            </>
          ) : (
            "Baseline view — severity bands reflect the entire record."
          )}
        </p>
      </div>
      {filtered && showTrendsLink && (
        <Link to={ROUTES.trends} className="temporal-scope-banner__link">
          Compare two periods
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
