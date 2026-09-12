import React from 'react';
import { Tooltip } from '../ui/Tooltip';

export function ContributorsList({ contributors }) {
  if (!contributors || contributors.length === 0) return <span className="text-fg-muted">-</span>;

  const displayContributors = contributors.slice(0, 5);

  return (
    <div className="flex -space-x-1.5 py-0.5">
      {displayContributors.map(user => (
        <Tooltip key={user.login} content={user.login}>
          <a href={user.html_url} target="_blank" rel="noreferrer" className="inline-block rounded-full ring-2 ring-canvas-default relative hover:z-10 hover:-translate-y-0.5 transition-transform">
            <img 
              src={user.avatar_url} 
              alt={user.login} 
              className="w-5 h-5 rounded-full"
            />
          </a>
        </Tooltip>
      ))}
    </div>
  );
}
