import React, { useEffect, useState } from "react";

/**
 * Smooth rolling number that animates from 0 → target.
 * Renders monospaced tabular digits, perfect for KPI hero numbers.
 */
export default function Odometer({
  value = 0,
  duration = 1600,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  style = {},
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString("en-IN");

  return (
    <span
      className={`odometer ${className}`}
      style={style}
      data-testid="odometer-value"
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
