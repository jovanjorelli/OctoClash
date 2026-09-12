import React, { memo, useState, useMemo, useEffect } from 'react';
import {
  StarIcon,
  RepoForkedIcon,
  EyeIcon,
  IssueOpenedIcon,
  LawIcon,
  BookIcon,
  PeopleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GitCommitIcon,
  CheckIcon,
  XIcon,
  DatabaseIcon,
  TagIcon,
  HeartIcon,
  CodeIcon,
  PackageIcon,
  GrabberIcon,
  TrashIcon,
} from '@primer/octicons-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContributorsList } from './ContributorsList';
import { useAppStore } from '../../store/appStore';
import { Tooltip } from '../ui/Tooltip';
import { fetchNpmWeeklyDownloads, formatNpmDownloads } from '../../services/npmApi';

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

function CommitSparkline({ activity }) {
  if (!Array.isArray(activity) || activity.length === 0) return null;
  const lastWeeks = activity.slice(-12);
  const values = lastWeeks.map((w) => Number(w?.total) || 0);
  const maxVal = Math.max(...values, 1);
  const width = 36;
  const height = 12;
  const padding = 1.5;

  const points = values
    .map((val, idx) => {
      const x = padding + (idx / Math.max(1, values.length - 1)) * (width - padding * 2);
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className="inline-block ml-1.5 overflow-visible align-middle shrink-0 opacity-80 hover:opacity-100 transition-opacity"
      aria-label="12-week commit activity trend"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="text-fg-accent"
      />
    </svg>
  );
}

function HealthGradeBadge({ score, grade }) {
  let colorClass = 'border-fg-danger/40 text-fg-danger bg-fg-danger/10';
  if (grade === 'A+' || grade === 'A') {
    colorClass = 'border-fg-success/40 text-fg-success bg-fg-success/10';
  } else if (grade === 'B') {
    colorClass = 'border-fg-accent/40 text-fg-accent bg-fg-accent/10';
  } else if (grade === 'C') {
    colorClass = 'border-fg-warning/40 text-fg-warning bg-fg-warning/10';
  } else if (grade === 'D') {
    colorClass = 'border-border-default text-fg-muted bg-canvas-subtle';
  }

  return (
    <div className="flex items-center gap-1 whitespace-nowrap text-xs">
      <span className="tabular-nums font-semibold text-fg-default">{score ?? 0}</span>
      {grade && (
        <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${colorClass}`}>
          {grade}
        </span>
      )}
    </div>
  );
}

function LatestReleaseBadge({ release }) {
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
}

function LicenseBadge({ classification, fallbackSpdx }) {
  const label = classification?.label || fallbackSpdx || 'None';
  const type = classification?.type || (label === 'None' ? 'unlicensed' : 'other');

  if (type === 'unlicensed') {
    return (
      <span className="inline-block px-1.5 py-0.2 text-[10px] rounded border border-border-default bg-canvas-subtle text-fg-muted whitespace-nowrap">
        {label}
      </span>
    );
  }

  if (type === 'permissive') {
    return (
      <Tooltip text="Permissive: permits commercial, private, and modification use without copyleft restrictions.">
        <span className="inline-block px-1.5 py-0.2 text-[10px] font-semibold rounded-full border border-fg-success/40 bg-fg-success/10 text-fg-success whitespace-nowrap">
          {label}
        </span>
      </Tooltip>
    );
  }

  if (type === 'copyleft') {
    return (
      <Tooltip text="Copyleft: derivative works generally must be licensed under the same terms.">
        <span className="inline-block px-1.5 py-0.2 text-[10px] font-semibold rounded-full border border-fg-warning/40 bg-fg-warning/10 text-fg-warning whitespace-nowrap">
          {label}
        </span>
      </Tooltip>
    );
  }

  return (
    <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium rounded-full border border-border-default bg-canvas-subtle text-fg-default whitespace-nowrap">
      {label}
    </span>
  );
}

function SortableTableRow({
  repo,
  leaders,
  npmDownloads,
  isColVisible,
  setPreviewRepo,
  removeRepo,
}) {
  const { info, contributors, avgIssueTime, commitsLastYear, commitActivity, healthScore, healthGrade, latestRelease, licenseClassification } = repo;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: info.full_name });

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
  const isWatcherLeader = leaders.maxWatchers > 0 && (info.subscribers_count || info.watchers_count) === leaders.maxWatchers;
  const isIssueLeader = leaders.minIssues !== undefined && info.open_issues_count === leaders.minIssues;
  const repoNpm = npmDownloads[info.full_name];
  const isNpmLeader = leaders.maxNpm > 0 && repoNpm === leaders.maxNpm;
  const sizeFormatted = info.size ? `${(info.size / 1024).toFixed(1)} MB` : '0 MB';

  return (
    <tr ref={setNodeRef} style={style} className="group border-b border-border-muted hover:bg-canvas-subtle transition-colors relative">
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
          <a href={info.html_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1.5 truncate max-w-[200px] text-xs">
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
        <td className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${isNpmLeader ? 'font-bold text-fg-success' : 'text-fg-default'}`}>
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
        <td className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${isCommitLeader ? 'font-bold text-fg-success' : 'text-fg-default'}`}>
          <span>{commitsLastYear !== undefined ? commitsLastYear.toLocaleString() : '0'}</span>
          {isCommitLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
          <CommitSparkline activity={commitActivity} />
        </td>
      )}
      {isColVisible('stars') && (
        <td className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${isStarLeader ? 'font-bold text-fg-success' : 'text-fg-default'}`}>
          {(info.stargazers_count || 0).toLocaleString()}
          {isStarLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
        </td>
      )}
      {isColVisible('forks') && (
        <td className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${isForkLeader ? 'font-bold text-fg-success' : 'text-fg-default'}`}>
          {(info.forks_count || 0).toLocaleString()}
          {isForkLeader && <CheckIcon size={12} className="inline ml-1 text-fg-success" />}
        </td>
      )}
      {isColVisible('watchers') && (
        <td className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${isWatcherLeader ? 'font-bold text-fg-success' : 'text-fg-default'}`}>
          {(info.subscribers_count || info.watchers_count || 0).toLocaleString()}
        </td>
      )}
      {isColVisible('issues') && (
        <td className={`px-2 py-1.5 border-r border-border-muted tabular-nums whitespace-nowrap text-xs ${isIssueLeader ? 'font-bold text-fg-success' : 'text-fg-default'}`}>
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
          <LicenseBadge classification={licenseClassification} fallbackSpdx={info.license?.spdx_id} />
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
}

export const ComparisonTable = memo(function ComparisonTable() {
  const reposData = useAppStore((state) => state.reposData);
  const setPreviewRepo = useAppStore((state) => state.setPreviewRepo);
  const reorderRepos = useAppStore((state) => state.reorderRepos);
  const removeRepo = useAppStore((state) => state.removeRepo);
  const visibleColumns = useAppStore((state) => state.visibleColumns);
  const npmDownloads = useAppStore((state) => state.npmDownloads);
  const setNpmDownloads = useAppStore((state) => state.setNpmDownloads);

  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      if (sortKey !== null) {
        setSortKey(null);
      }
      const oldIndex = reposData.findIndex((r) => r.info.full_name === active.id);
      const newIndex = reposData.findIndex((r) => r.info.full_name === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderRepos(oldIndex, newIndex);
      }
    }
  };

  useEffect(() => {
    if (!reposData || reposData.length === 0) return;
    reposData.forEach((repo) => {
      const fullName = repo?.info?.full_name;
      if (fullName && npmDownloads[fullName] === undefined) {
        fetchNpmWeeklyDownloads(fullName).then((count) => {
          setNpmDownloads(fullName, count);
        });
      }
    });
  }, [reposData, npmDownloads, setNpmDownloads]);

  const leaders = useMemo(() => {
    if (!reposData || reposData.length < 2) return {};
    const maxHealth = Math.max(...reposData.map((r) => r.healthScore || 0));
    const maxStars = Math.max(...reposData.map((r) => r.info.stargazers_count || 0));
    const maxCommits = Math.max(...reposData.map((r) => r.commitsLastYear || 0));
    const maxForks = Math.max(...reposData.map((r) => r.info.forks_count || 0));
    const maxWatchers = Math.max(...reposData.map((r) => r.info.subscribers_count || r.info.watchers_count || 0));
    const minIssues = Math.min(...reposData.map((r) => r.info.open_issues_count || 0));
    const maxNpm = Math.max(
      ...reposData.map((r) => {
        const d = npmDownloads[r?.info?.full_name];
        return typeof d === 'number' ? d : -1;
      })
    );

    return { maxHealth, maxStars, maxCommits, maxForks, maxWatchers, minIssues, maxNpm };
  }, [reposData, npmDownloads]);

  const sortedData = useMemo(() => {
    if (!reposData) return [];
    if (!sortKey) return reposData;

    return [...reposData].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortKey === 'language') {
        const langA = a.info.language || '';
        const langB = b.info.language || '';
        return sortOrder === 'desc' ? langB.localeCompare(langA) : langA.localeCompare(langB);
      } else if (sortKey === 'npm') {
        const dA = npmDownloads[a?.info?.full_name];
        const dB = npmDownloads[b?.info?.full_name];
        valA = typeof dA === 'number' ? dA : -1;
        valB = typeof dB === 'number' ? dB : -1;
      } else if (sortKey === 'health') {
        valA = a.healthScore || 0;
        valB = b.healthScore || 0;
      } else if (sortKey === 'stars') {
        valA = a.info.stargazers_count || 0;
        valB = b.info.stargazers_count || 0;
      } else if (sortKey === 'commits') {
        valA = a.commitsLastYear || 0;
        valB = b.commitsLastYear || 0;
      } else if (sortKey === 'forks') {
        valA = a.info.forks_count || 0;
        valB = b.info.forks_count || 0;
      } else if (sortKey === 'watchers') {
        valA = a.info.subscribers_count || a.info.watchers_count || 0;
        valB = b.info.subscribers_count || b.info.watchers_count || 0;
      } else if (sortKey === 'issues') {
        valA = a.info.open_issues_count || 0;
        valB = b.info.open_issues_count || 0;
      } else if (sortKey === 'size') {
        valA = a.info.size || 0;
        valB = b.info.size || 0;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [reposData, sortKey, sortOrder, npmDownloads]);

  if (!reposData || reposData.length === 0) return null;

  const toggleSort = (key) => {
    if (sortKey === key) {
      if (sortOrder === 'desc') setSortOrder('asc');
      else {
        setSortKey(null);
        setSortOrder('desc');
      }
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const renderSortIndicator = (key) => {
    if (sortKey !== key) return null;
    return sortOrder === 'desc' ? (
      <ChevronDownIcon size={12} className="inline ml-1 text-fg-accent" />
    ) : (
      <ChevronUpIcon size={12} className="inline ml-1 text-fg-accent" />
    );
  };

  const isColVisible = (colId) => (visibleColumns ? visibleColumns[colId] !== false : true);

  return (
    <div className="table-scroll-container w-full max-h-full overflow-auto border border-border-default rounded bg-canvas-default shadow-sm relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default select-none sticky top-0 z-20 shadow-xs">
            <tr>
              <th className="px-2.5 py-2 font-semibold sticky left-0 top-0 bg-canvas-subtle z-30 border-r border-border-default min-w-[190px]">
                Repository
              </th>
              {isColVisible('language') && (
                <th
                  onClick={() => toggleSort('language')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <CodeIcon className="mr-1 inline" size={13} />Language
                  {renderSortIndicator('language')}
                </th>
              )}
              {isColVisible('npm') && (
                <th
                  onClick={() => toggleSort('npm')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <PackageIcon className="mr-1 inline" size={13} />NPM / wk
                  {renderSortIndicator('npm')}
                </th>
              )}
              {isColVisible('health') && (
                <th
                  onClick={() => toggleSort('health')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <HeartIcon className="mr-1 inline text-fg-danger" size={13} />Health Score
                  {renderSortIndicator('health')}
                </th>
              )}
              {isColVisible('release') && (
                <th className="px-2 py-2 font-semibold border-r border-border-default whitespace-nowrap">
                  <TagIcon className="mr-1 inline" size={13} />Latest Release
                </th>
              )}
              {isColVisible('commits') && (
                <th
                  onClick={() => toggleSort('commits')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <GitCommitIcon className="mr-1 inline" size={13} />Commits (1y)
                  {renderSortIndicator('commits')}
                </th>
              )}
              {isColVisible('stars') && (
                <th
                  onClick={() => toggleSort('stars')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <StarIcon className="mr-1 inline" size={13} />Stars
                  {renderSortIndicator('stars')}
                </th>
              )}
              {isColVisible('forks') && (
                <th
                  onClick={() => toggleSort('forks')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <RepoForkedIcon className="mr-1 inline" size={13} />Forks
                  {renderSortIndicator('forks')}
                </th>
              )}
              {isColVisible('watchers') && (
                <th
                  onClick={() => toggleSort('watchers')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <EyeIcon className="mr-1 inline" size={13} />Watchers
                  {renderSortIndicator('watchers')}
                </th>
              )}
              {isColVisible('issues') && (
                <th
                  onClick={() => toggleSort('issues')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <IssueOpenedIcon className="mr-1 inline" size={13} />Issues
                  {renderSortIndicator('issues')}
                </th>
              )}
              {isColVisible('size') && (
                <th
                  onClick={() => toggleSort('size')}
                  className="px-2 py-2 font-semibold border-r border-border-default cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors whitespace-nowrap"
                >
                  <DatabaseIcon className="mr-1 inline" size={13} />Size
                  {renderSortIndicator('size')}
                </th>
              )}
              {isColVisible('fixTime') && (
                <th className="px-2 py-2 font-semibold border-r border-border-default whitespace-nowrap">
                  Fix Time
                </th>
              )}
              {isColVisible('license') && (
                <th className="px-2 py-2 font-semibold border-r border-border-default whitespace-nowrap">
                  <LawIcon className="mr-1 inline" size={13} />License
                </th>
              )}
              {isColVisible('readme') && (
                <th className="px-2 py-2 font-semibold text-center border-r border-border-default whitespace-nowrap">
                  <BookIcon className="mr-1 inline" size={13} />README
                </th>
              )}
              {isColVisible('contributors') && (
                <th className="px-2 py-2 font-semibold border-r border-border-default whitespace-nowrap">
                  <PeopleIcon className="mr-1 inline" size={13} />Top Contributors
                </th>
              )}
              <th className="px-2 py-2 font-semibold text-center w-10 text-fg-muted">
                <TrashIcon size={14} className="inline opacity-70" />
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            <SortableContext
              items={sortedData.map((r) => r.info.full_name)}
              strategy={verticalListSortingStrategy}
            >
              {sortedData.map((repo) => (
                <SortableTableRow
                  key={repo.info.full_name}
                  repo={repo}
                  leaders={leaders}
                  npmDownloads={npmDownloads}
                  isColVisible={isColVisible}
                  setPreviewRepo={setPreviewRepo}
                  removeRepo={removeRepo}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
});
