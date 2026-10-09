import React, { memo } from 'react';

/**
 * Miniature SVG polyline visualizing 12-week commit activity trends.
 * @param {{ activity: Array<{ total: number }> }} props
 */
export const CommitSparkline = memo(function CommitSparkline({ activity }) {
  if (!Array.isArray(activity) || activity.length === 0) return null;
  const lastWeeks = activity.slice(-12);
  const values = lastWeeks.map((w) => Number(w?.total) || 0);
  const maxVal = Math.max(...values, 1);
  const width = 36;
  const height = 12;
  const padding = 1.5;

  const points = values
    .map((val, idx) => {
      const x = padding + (idx / Math.max(1, values.length - 1)) * (width - padding * 2);
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className="inline-block ml-1.5 overflow-visible align-middle shrink-0 opacity-80 hover:opacity-100 transition-opacity"
      aria-label="12-week commit activity trend"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="text-fg-accent"
      />
    </svg>
  );
});
