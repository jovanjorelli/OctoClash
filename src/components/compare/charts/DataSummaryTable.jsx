import React, { memo } from 'react';

export const DataSummaryTable = memo(function DataSummaryTable({ reposData }) {
  return (
    <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
      <h3 className="text-lg text-fg-default font-semibold mb-6">Data Summary</h3>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
            <tr>
              <th className="px-4 py-3 font-semibold">Repository</th>
              <th className="px-4 py-3 font-semibold">Commits (1y)</th>
              <th className="px-4 py-3 font-semibold">Stars</th>
              <th className="px-4 py-3 font-semibold">Forks</th>
              <th className="px-4 py-3 font-semibold">Open Issues</th>
            </tr>
          </thead>
          <tbody>
            {reposData.map((repo) => (
              <tr key={repo.info.full_name} className="border-b border-border-muted hover:bg-canvas-subtle transition-colors">
                <td className="px-4 py-3 font-medium text-fg-accent">
                  <a href={repo.info.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                    {repo.info.full_name}
                  </a>
                </td>
                <td className="px-4 py-3 text-fg-default">{repo.commitsLastYear?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-fg-default">{(repo.info.stargazers_count || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-fg-default">{(repo.info.forks_count || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-fg-default">{(repo.info.open_issues_count || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
