import React, { useState } from 'react';
import { ShareIcon, CheckIcon, DownloadIcon, ImageIcon } from '@primer/octicons-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/appStore';
import { exportBattleCardPng } from '../../utils/cardGenerator';

export function SharePanel() {
  const [copying, setCopying] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [manualTheme, setManualTheme] = useState(null);
  const reposData = useAppStore((state) => state.reposData);
  const npmDownloads = useAppStore((state) => state.npmDownloads);
  const storeTheme = useAppStore((state) => state.theme);

  const activeTheme = manualTheme || (
    storeTheme === 'dark'
      ? 'dark'
      : storeTheme === 'light'
      ? 'light'
      : typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('ui');
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url.toString());
        } else {
          throw new Error('clipboardUnavailable');
        }
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = url.toString();
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleExportCsv = () => {
    if (!reposData || reposData.length === 0) return;
    const headers = ['Repository', 'Language', 'Health Score', 'Health Grade', 'Latest Release', 'Stars', 'Forks', 'Watchers', 'Commits (1y)', 'Open Issues', 'Avg Issue Time', 'License'];
    const rows = reposData.map(({ info, commitsLastYear, avgIssueTime, healthScore, healthGrade, latestRelease }) => [
      `"${info.full_name}"`,
      `"${info.language || '-'}"`,
      healthScore || 0,
      `"${healthGrade || '-'}"`,
      `"${latestRelease?.tag || '-'}"`,
      info.stargazers_count || 0,
      info.forks_count || 0,
      info.subscribers_count || info.watchers_count || 0,
      commitsLastYear || 0,
      info.open_issues_count || 0,
      `"${avgIssueTime || '-'}"`,
      `"${info.license?.spdx_id || 'None'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `octoclash-comparison-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!reposData || reposData.length === 0) return;
    const exportPayload = reposData.map(({ info, commitsLastYear, avgIssueTime, languages, healthScore, healthGrade, latestRelease }) => ({
      name: info.name,
      full_name: info.full_name,
      html_url: info.html_url,
      language: info.language || null,
      health_score: healthScore,
      health_grade: healthGrade,
      latest_release: latestRelease?.tag || null,
      stars: info.stargazers_count,
      forks: info.forks_count,
      watchers: info.subscribers_count || info.watchers_count,
      commits_1y: commitsLastYear,
      open_issues: info.open_issues_count,
      avg_issue_resolution_time: avgIssueTime,
      license: info.license?.spdx_id || 'None',
      languages,
    }));

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `octoclash-comparison-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async () => {
    if (!reposData || reposData.length === 0 || exportingPng) return;
    try {
      setExportingPng(true);
      await exportBattleCardPng(
        reposData,
        npmDownloads,
        activeTheme,
        (progress) => setExportProgress(progress)
      );
    } catch (err) {
      console.error('Failed to export PNG', err);
    } finally {
      setExportingPng(false);
      setExportProgress(null);
    }
  };

  const toggleTheme = () => {
    setManualTheme(activeTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-t border-border-muted mt-2 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs sm:text-sm font-semibold text-fg-default">Share & Export:</span>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 text-xs py-1"
        >
          {copying ? <CheckIcon className="text-fg-success" /> : <ShareIcon />}
          <span>{copying ? 'Copied Link!' : 'Copy Share Link'}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-md shadow-xs">
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleExportPng}
            disabled={exportingPng}
            className="flex items-center gap-1.5 text-xs rounded-r-none border-r-0 py-1"
            title={`Export comparison as battle card PNG (${activeTheme === 'dark' ? 'Dark' : 'Light'} theme)`}
          >
            <ImageIcon size={14} />
            <span>
              {exportingPng
                ? exportProgress && exportProgress.total > 1
                  ? `Generating (${exportProgress.current}/${exportProgress.total})...`
                  : 'Generating...'
                : reposData && reposData.length > 10
                  ? `Export PNG (${Math.ceil(reposData.length / 10)} parts)`
                  : 'Export PNG'}
            </span>
          </Button>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-2.5 py-1 bg-canvas-subtle border border-border-default rounded-r-md text-[11px] font-semibold text-fg-muted hover:text-fg-default hover:bg-canvas-inset transition-colors cursor-pointer capitalize"
            title={`Current battle card theme: ${activeTheme}. Click to toggle.`}
            aria-label={`Current battle card theme: ${activeTheme}. Click to toggle.`}
          >
            {activeTheme}
          </button>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 text-xs"
          title="Export comparison as CSV spreadsheet"
        >
          <DownloadIcon size={14} />
          <span>Export CSV</span>
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleExportJson}
          className="flex items-center gap-1.5 text-xs"
          title="Export comparison as JSON data"
        >
          <DownloadIcon size={14} />
          <span>Export JSON</span>
        </Button>
      </div>
    </div>
  );
}
