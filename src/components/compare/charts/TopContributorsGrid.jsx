import React, { memo } from 'react';
import { ContributorsList } from '../ContributorsList';

export const TopContributorsGrid = memo(function TopContributorsGrid({ reposData }) {
  return (
    <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm">
      <h3 className="text-lg text-fg-default font-semibold mb-6">Top Contributors by Repository</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {reposData.map((repo) => (
          <div
            key={repo.info.full_name}
            className="flex flex-col gap-3 p-4 border border-border-muted rounded-xl bg-canvas-subtle hover:bg-canvas-default hover:shadow-md transition-all"
          >
            <a
              href={repo.info.html_url}
              target="_blank"
              rel="noreferrer"
              className="block text-fg-accent font-semibold hover:underline text-sm truncate"
            >
              {repo.info.full_name}
            </a>
            <ContributorsList contributors={repo.contributors} />
          </div>
        ))}
      </div>
    </div>
  );
});
