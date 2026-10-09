import React, { memo } from 'react';

/**
 * Pill badge displaying numeric health score alongside letter grade with semantic status styling.
 * @param {{ score: number, grade: string }} props
 */
export const HealthGradeBadge = memo(function HealthGradeBadge({ score, grade }) {
  let colorClass = 'border-fg-danger/40 text-fg-danger bg-fg-danger/10';
  if (grade === 'A+' || grade === 'A') {
    colorClass = 'border-fg-success/40 text-fg-success bg-fg-success/10';
  } else if (grade === 'B') {
    colorClass = 'border-fg-accent/40 text-fg-accent bg-fg-accent/10';
  } else if (grade === 'C') {
    colorClass = 'border-fg-warning/40 text-fg-warning bg-fg-warning/10';
  } else if (grade === 'D') {
    colorClass = 'border-border-default text-fg-muted bg-canvas-subtle';
  }

  return (
    <div className="flex items-center gap-1 whitespace-nowrap text-xs">
      <span className="tabular-nums font-semibold text-fg-default">{score ?? 0}</span>
      {grade && (
        <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${colorClass}`}>
          {grade}
        </span>
      )}
    </div>
  );
});
