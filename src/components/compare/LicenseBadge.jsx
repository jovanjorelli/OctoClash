import React, { memo } from 'react';
import { Tooltip } from '../ui/Tooltip';

/**
 * Color-coded license badge with explanatory tooltip for permissive, copyleft, and custom licenses.
 * @param {{ classification: { label: string, type: 'unlicensed'|'permissive'|'copyleft'|'other' }, fallbackSpdx: string }} props
 */
export const LicenseBadge = memo(function LicenseBadge({ classification, fallbackSpdx }) {
  const label = classification?.label || fallbackSpdx || 'None';
  const type = classification?.type || (label === 'None' ? 'unlicensed' : 'other');

  if (type === 'unlicensed') {
    return (
      <span className="inline-block px-1.5 py-0.2 text-[10px] rounded border border-border-default bg-canvas-subtle text-fg-muted whitespace-nowrap">
        {label}
      </span>
    );
  }

  if (type === 'permissive') {
    return (
      <Tooltip text="Permissive: permits commercial, private, and modification use without copyleft restrictions.">
        <span className="inline-block px-1.5 py-0.2 text-[10px] font-semibold rounded-full border border-fg-success/40 bg-fg-success/10 text-fg-success whitespace-nowrap">
          {label}
        </span>
      </Tooltip>
    );
  }

  if (type === 'copyleft') {
    return (
      <Tooltip text="Copyleft: derivative works generally must be licensed under the same terms.">
        <span className="inline-block px-1.5 py-0.2 text-[10px] font-semibold rounded-full border border-fg-warning/40 bg-fg-warning/10 text-fg-warning whitespace-nowrap">
          {label}
        </span>
      </Tooltip>
    );
  }

  return (
    <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium rounded-full border border-border-default bg-canvas-subtle text-fg-default whitespace-nowrap">
      {label}
    </span>
  );
});
