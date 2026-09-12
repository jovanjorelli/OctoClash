import React, { memo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer
} from 'recharts';

export const StarHistoryChart = memo(function StarHistoryChart({
  starData,
  reposData,
  loadingStars,
  colors,
  tooltipStyle,
}) {
  return (
    <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm lg:col-span-2">
      <h3 className="text-lg text-fg-default font-semibold mb-6 flex items-center gap-2">
        Star Growth History
        {loadingStars && (
          <span className="text-xs px-2 py-1 bg-canvas-subtle rounded-full text-fg-muted font-normal animate-pulse">
            Syncing...
          </span>
        )}
      </h3>
      <div className="h-[400px]">
        {starData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={starData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--color-fg-muted)"
                fontSize={12}
                dy={10}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border-muted)' }}
              />
              <YAxis
                stroke="var(--color-fg-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
              />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 13, color: 'var(--color-fg-default)', paddingTop: '20px' }} />
              {reposData.map((repo, idx) => (
                <Line
                  key={repo.info.full_name}
                  type="monotone"
                  dataKey={repo.info.full_name}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={3}
                  strokeOpacity={0.85}
                  dot={false}
                  activeDot={{ r: 8 - (idx % 4), strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-fg-muted text-sm gap-3">
            {loadingStars ? (
              <div role="status" aria-label="Loading historical stars" className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-border-default border-t-fg-accent rounded-full animate-spin" />
                <p>Fetching historical stars...</p>
              </div>
            ) : (
              'Not enough data to display star history.'
            )}
          </div>
        )}
      </div>
    </div>
  );
});
