import React, { memo } from 'react';

export const LanguageBreakdownTable = memo(function LanguageBreakdownTable({ detailedLanguages }) {
  return (
    <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
      <h3 className="text-lg text-fg-default font-semibold mb-6">Language Breakdown by Repository</h3>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
            <tr>
              <th className="px-4 py-3 font-semibold w-1/4">Repository</th>
              <th className="px-4 py-3 font-semibold w-3/4">Languages</th>
            </tr>
          </thead>
          <tbody>
            {detailedLanguages.map((details) => (
              <tr key={details.repo} className="border-b border-border-muted hover:bg-canvas-subtle transition-colors">
                <td className="px-4 py-4 font-medium text-fg-accent align-top">
                  <a href={details.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                    {details.repo}
                  </a>
                </td>
                <td className="px-4 py-4">
                  {details.langs.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="w-full h-2 rounded-full overflow-hidden flex bg-canvas-subtle">
                        {details.langs.map((lang) => (
                          <div
                            key={lang.name}
                            style={{ width: `${lang.percent}%`, backgroundColor: lang.color }}
                            className="h-full"
                            title={`${lang.name}: ${lang.percent.toFixed(1)}%`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {details.langs.map((lang) => (
                          <div key={lang.name} className="flex items-center gap-1.5 text-xs text-fg-default">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                            <span className="font-semibold">{lang.name}</span>
                            <span className="text-fg-muted">{lang.percent.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-fg-muted italic">No languages detected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
