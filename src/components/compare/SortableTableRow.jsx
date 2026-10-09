import React, { memo } from 'react';
import {
  GrabberIcon,
  CheckIcon,
  BookIcon,
  XIcon,
} from '@primer/octicons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContributorsList } from './ContributorsList';
import { Tooltip } from '../ui/Tooltip';
import { formatNpmDownloads } from '../../services/npmApi';
import { CommitSparkline } from './CommitSparkline';
import { HealthGradeBadge } from './HealthGradeBadge';
import { LatestReleaseBadge } from './LatestReleaseBadge';
import { LicenseBadge } from './LicenseBadge';

const GITHUB_LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Lua: '#000080',
};

/**
 * Sortable table row representing one repository with leader checkmarks and interactive cell metrics.
 * @param {{
 *   repo: object,
 *   leaders: object,
 *   npmDownloads: Record<string, number>,
 *   isColVisible: (colId: string) => boolean,
 *   setPreviewRepo: (name: string) => void,
 *   removeRepo: (name: string) => void
 * }} props
 */
export const SortableTableRow = memo(function SortableTableRow({
  repo,
  leaders,
  npmDownloads,
  isColVisible,
  setPreviewRepo,
  removeRepo,
}) {
  const {
    info,
    contributors,
    avgIssueTime,
    commitsLastYear,
    commitActivity,
    healthScore,
    healthGrade,
    latestRelease,
    licenseClassification,
  } = repo;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: info.full_name,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 25 : undefined,
  };

  const isHealthLeader = leaders.maxHealth > 0 && healthScore === leaders.maxHealth;
  const isStarLeader = leaders.maxStars > 0 && info.stargazers_count === leaders.maxStars;
  const isCommitLeader = leaders.maxCommits > 0 && commitsLastYear === leaders.maxCommits;
  const isForkLeader = leaders.maxForks > 0 && info.forks_count === leaders.maxForks;
  const isWatcherLeader =
    leaders.maxWatchers > 0 &&
    (info.subscribers_count ?? info.watchers_count ?? 0) === leaders.maxWatchers;
  const isIssueLeader = leaders.minIssues !== undefined && info.open_issues_count === leaders.minIssues;
  const repoNpm = npmDownloads[info.full_name];
  const isNpmLeader = leaders.maxNpm > 0 && repoNpm === leaders.maxNpm;
  const sizeFormatted = info.size ? `${(info.size / 1024).toFixed(1)} MB` : '0 MB';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="group border-b border-border-muted hover:bg-canvas-subtle transition-colors relative"
    >
      <td className="px-2 py-1.5 font-semibold text-fg-accent sticky left-0 bg-canvas-default group-hover:bg-canvas-subtle z-10 border-r border-border-default whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 text-fg-muted hover:text-fg-default cursor-grab active:cursor-grabbing shrink-0 touch-none select-none rounded hover:bg-canvas-inset transition-colors"
            title="Drag to reorder"
            aria-label={`Drag to reorder ${info.full_name}`}
          >
            <GrabberIcon size={14} />
          </button>
          <a
            href={info.html_url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1.5 truncate max-w-[200px] text-xs"
          >
            <img
              src={info.owner?.avatar_url}
              alt=""
              className="w-4 h-4 rounded-full inline shrink-0"
            />
            <span className="truncate">{info.full_name}</span>
          </a>
        </div>
      </td>
      {isColVisible('language') && (
        <td className="px-2 py-1.5 border-r border-border-muted whitespace-nowrap text-xs">
          {info.language ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: GITHUB_LANG_COLORS[info.language] || '#8b949e' }}
              />
              <span className="text-fg-default">{info.language}</span>
            </span>
          ) : (
            <span className="text-fg-muted">-</span>
          )}
        </td>
      )}
      {isColVisible('npm') && (
        <td
          className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${
            isNpmLeader ? 'font-bold text-fg-success' : 'text-fg-default'
          }`}
        >
          <span>{formatNpmDownloads(repoNpm)}</span>
          {isNpmLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
        </td>
      )}
      {isColVisible('health') && (
        <td className="px-2 py-1.5 border-r border-border-muted whitespace-nowrap">
          <HealthGradeBadge score={healthScore} grade={healthGrade} />
          {isHealthLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
        </td>
      )}
      {isColVisible('release') && (
        <td className="px-2 py-1.5 border-r border-border-muted whitespace-nowrap">
          <LatestReleaseBadge release={latestRelease} />
        </td>
      )}
      {isColVisible('commits') && (
        <td
          className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${
            isCommitLeader ? 'font-bold text-fg-success' : 'text-fg-default'
          }`}
        >
          <span>{commitsLastYear !== undefined ? commitsLastYear.toLocaleString() : '0'}</span>
          {isCommitLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
          <CommitSparkline activity={commitActivity} />
        </td>
      )}
      {isColVisible('stars') && (
        <td
          className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${
            isStarLeader ? 'font-bold text-fg-success' : 'text-fg-default'
          }`}
        >
          {(info.stargazers_count || 0).toLocaleString()}
          {isStarLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
        </td>
      )}
      {isColVisible('forks') && (
        <td
          className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${
            isForkLeader ? 'font-bold text-fg-success' : 'text-fg-default'
          }`}
        >
          {(info.forks_count || 0).toLocaleString()}
          {isForkLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
        </td>
      )}
      {isColVisible('watchers') && (
        <td
          className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${
            isWatcherLeader ? 'font-bold text-fg-success' : 'text-fg-default'
          }`}
        >
          {(info.subscribers_count ?? info.watchers_count ?? 0).toLocaleString()}
        </td>
      )}
      {isColVisible('issues') && (
        <td
          className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${
            isIssueLeader ? 'font-bold text-fg-success' : 'text-fg-default'
          }`}
        >
          {(info.open_issues_count || 0).toLocaleString()}
        </td>
      )}
      {isColVisible('size') && (
        <td className="px-2 py-1.5 text-fg-default border-r border-border-muted tabular-nums whitespace-nowrap text-xs">
          {sizeFormatted}
        </td>
      )}
      {isColVisible('fixTime') && (
        <td className="px-2 py-1.5 text-fg-default border-r border-border-muted whitespace-nowrap text-xs">
          {avgIssueTime || <span className="text-fg-muted">-</span>}
        </td>
      )}
      {isColVisible('license') && (
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-border-muted text-xs">
          <LicenseBadge
            classification={licenseClassification}
            fallbackSpdx={info.license?.spdx_id}
          />
        </td>
      )}
      {isColVisible('readme') && (
        <td className="px-1.5 py-1.5 text-center border-r border-border-muted">
          <Tooltip text="View README">
            <button
              type="button"
              onClick={(e) => {
                setPreviewRepo(info.full_name);
                e.currentTarget.blur();
              }}
              className="text-fg-muted hover:text-fg-accent p-0.5 rounded transition-colors cursor-pointer"
              aria-label={`View README for ${info.full_name}`}
            >
              <BookIcon size={14} />
            </button>
          </Tooltip>
        </td>
      )}
      {isColVisible('contributors') && (
        <td className="px-2 py-0.5 border-r border-border-muted">
          <ContributorsList contributors={contributors} />
        </td>
      )}
      <td className="px-1.5 py-1.5 text-center whitespace-nowrap w-10">
        <button
          type="button"
          onClick={() => removeRepo(info.full_name)}
          className="text-fg-muted hover:text-fg-danger p-0.5 rounded transition-colors cursor-pointer"
          title={`Remove ${info.full_name}`}
          aria-label={`Remove ${info.full_name}`}
        >
          <XIcon size={13} />
        </button>
      </td>
    </tr>
  );
});
