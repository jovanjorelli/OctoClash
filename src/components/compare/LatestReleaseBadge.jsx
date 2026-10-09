import React, { memo } from 'react';

/**
 * External link badge to repository's latest release tag and publication elapsed duration.
 * @param {{ release: { url: string, tag: string, name?: string, daysAgo?: number } }} props
 */
export const LatestReleaseBadge = memo(function LatestReleaseBadge({ release }) {
  if (!release) {
    return <span className="text-fg-muted">-</span>;
  }

  let timeAgo = '';
  if (typeof release.daysAgo === 'number') {
    if (release.daysAgo === 0) timeAgo = 'today';
    else if (release.daysAgo === 1) timeAgo = '1d';
    else if (release.daysAgo < 30) timeAgo = `${release.daysAgo}d`;
    else if (release.daysAgo < 365) timeAgo = `${Math.round(release.daysAgo / 30)}mo`;
    else timeAgo = `${Math.round(release.daysAgo / 365)}y`;
  }

  return (
    <div className="flex items-center gap-1 whitespace-nowrap text-xs">
      <a
        href={release.url}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs text-fg-accent hover:underline font-semibold truncate max-w-[85px]"
        title={release.name || release.tag}
      >
        {release.tag}
      </a>
      {timeAgo && (
        <span className="text-[9px] text-fg-muted bg-canvas-subtle border border-border-default px-1 py-0.2 rounded">
          {timeAgo}
        </span>
      )}
    </div>
  );
});
