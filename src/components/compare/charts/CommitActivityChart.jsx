import React, { memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer
} from 'recharts';

export const CommitActivityChart = memo(function CommitActivityChart({
  commitData,
  reposData,
  colors,
  tooltipStyle,
}) {
  return (
    <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm lg:col-span-2">
      <h3 className="text-lg text-fg-default font-semibold mb-6">Commit Activity (Last 12 Weeks)</h3>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={commitData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <defs>
              {reposData.map((repo, idx) => (
                <linearGradient key={`color-${repo.info.full_name}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} dy={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-fg-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13, color: 'var(--color-fg-default)', paddingTop: '20px' }} />
            {reposData.map((repo, idx) => (
              <Area
                key={repo.info.full_name}
                type="monotone"
                dataKey={repo.info.full_name}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${idx})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
