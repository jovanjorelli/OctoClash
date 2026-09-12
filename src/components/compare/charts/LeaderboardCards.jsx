import React, { memo } from 'react';
import { StarIcon, RepoForkedIcon, PulseIcon, FlameIcon, HeartIcon } from '@primer/octicons-react';

const LeaderboardCard = memo(function LeaderboardCard({
  title,
  icon: Icon,
  data,
  colorVariant,
  titleClass,
  valueSuffix = '',
}) {
  if (!data || data.length === 0) return null;
  const maxVal = data[0].value || 1;

  return (
    <div className="bg-canvas-default border border-border-default rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-[0.03] transition-opacity">
        <Icon size={80} />
      </div>
      <div className="flex items-center gap-2 text-fg-muted text-sm font-semibold uppercase tracking-wide">
        <Icon size={16} className={titleClass} /> {title}
      </div>
      <div className="flex flex-col gap-3 mt-1 z-10">
        {data.map((item, idx) => {
          const pct = Math.min(100, Math.max(0, ((item.value || 0) / maxVal) * 100));
          return (
            <div key={item.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-fg-default truncate pr-2" title={item.name}>
                  {idx + 1}. {item.name}
                </span>
                <span className="text-fg-muted font-mono text-xs whitespace-nowrap">
                  {(item.value || 0).toLocaleString()}{valueSuffix}
                </span>
              </div>
              <div className="w-full h-1.5 bg-canvas-subtle rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorVariant} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const LeaderboardCards = memo(function LeaderboardCards({ leaderboards }) {
  if (!leaderboards) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <LeaderboardCard
        title="Health & Maintenance"
        icon={HeartIcon}
        titleClass="text-fg-accent"
        colorVariant="bg-fg-accent"
        valueSuffix=" / 100"
        data={leaderboards.byHealth?.map(r => ({ name: r.info.name, value: r.healthScore || 0 }))}
      />
      <LeaderboardCard
        title="Popularity (Stars)"
        icon={StarIcon}
        titleClass="text-fg-warning"
        colorVariant="bg-fg-warning"
        data={leaderboards.byStars.map(r => ({ name: r.info.name, value: r.info.stargazers_count }))}
      />
      <LeaderboardCard
        title="Total Activity (1y)"
        icon={FlameIcon}
        titleClass="text-fg-danger"
        colorVariant="bg-fg-danger"
        data={leaderboards.byCommits.map(r => ({ name: r.info.name, value: r.commitsLastYear }))}
      />
      <LeaderboardCard
        title="Community (Forks)"
        icon={RepoForkedIcon}
        titleClass="text-fg-success"
        colorVariant="bg-fg-success"
        data={leaderboards.byForks.map(r => ({ name: r.info.name, value: r.info.forks_count }))}
      />
      <LeaderboardCard
        title="Update Frequency"
        icon={PulseIcon}
        titleClass="text-fg-done"
        colorVariant="bg-fg-done"
        valueSuffix=" / wk"
        data={leaderboards.byFrequency.map(r => ({ name: r.repo.info.name, value: r.commitsPerWeek }))}
      />
    </div>
  );
});
