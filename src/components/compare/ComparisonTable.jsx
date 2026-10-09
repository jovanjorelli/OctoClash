import React, { memo, useState, useMemo, useEffect, useRef } from 'react';
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
  DatabaseIcon,
  TagIcon,
  HeartIcon,
  CodeIcon,
  PackageIcon,
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
} from '@dnd-kit/sortable';
import { useAppStore } from '../../store/appStore';
import { fetchNpmWeeklyDownloads } from '../../services/npmApi';
import { SortableTableRow } from './SortableTableRow';

export { CommitSparkline } from './CommitSparkline';
export { HealthGradeBadge } from './HealthGradeBadge';
export { LatestReleaseBadge } from './LatestReleaseBadge';
export { LicenseBadge } from './LicenseBadge';
export { SortableTableRow } from './SortableTableRow';

const TABLE_COLUMNS = [
  { id: 'language', label: 'Language', icon: CodeIcon, sortable: true },
  { id: 'npm', label: 'NPM / wk', icon: PackageIcon, sortable: true },
  { id: 'health', label: 'Health Score', icon: HeartIcon, iconClass: 'text-fg-danger', sortable: true },
  { id: 'release', label: 'Latest Release', icon: TagIcon, sortable: false },
  { id: 'commits', label: 'Commits (1y)', icon: GitCommitIcon, sortable: true },
  { id: 'stars', label: 'Stars', icon: StarIcon, sortable: true },
  { id: 'forks', label: 'Forks', icon: RepoForkedIcon, sortable: true },
  { id: 'watchers', label: 'Watchers', icon: EyeIcon, sortable: true },
  { id: 'issues', label: 'Issues', icon: IssueOpenedIcon, sortable: true },
  { id: 'size', label: 'Size', icon: DatabaseIcon, sortable: true },
  { id: 'fixTime', label: 'Fix Time', sortable: false },
  { id: 'license', label: 'License', icon: LawIcon, sortable: false },
  { id: 'readme', label: 'README', icon: BookIcon, sortable: false, center: true },
  { id: 'contributors', label: 'Top Contributors', icon: PeopleIcon, sortable: false },
];

function getSortValue(repo, sortKey, npmDownloads) {
  if (sortKey === 'language') return repo.info.language || '';
  if (sortKey === 'npm') {
    const d = npmDownloads[repo?.info?.full_name];
    return typeof d === 'number' ? d : -1;
  }
  if (sortKey === 'health') return repo.healthScore || 0;
  if (sortKey === 'stars') return repo.info.stargazers_count || 0;
  if (sortKey === 'commits') return repo.commitsLastYear || 0;
  if (sortKey === 'forks') return repo.info.forks_count || 0;
  if (sortKey === 'watchers') return repo.info.subscribers_count ?? repo.info.watchers_count ?? 0;
  if (sortKey === 'issues') return repo.info.open_issues_count || 0;
  if (sortKey === 'size') return repo.info.size || 0;
  return 0;
}

/**
 * Primary comparison matrix table with sortable columns, metric leader highlighting,
 * draggable row reordering, and asynchronous npm download fetching.
 */
export const ComparisonTable = memo(function ComparisonTable() {
  const repos = useAppStore((state) => state.repos);
  const setRepos = useAppStore((state) => state.setRepos);
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
      const oldIndex = sortedData.findIndex((r) => r.info.full_name === active.id);
      const newIndex = sortedData.findIndex((r) => r.info.full_name === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        if (sortKey !== null) {
          setSortKey(null);
          const reorderedSorted = Array.from(sortedData);
          const [moved] = reorderedSorted.splice(oldIndex, 1);
          reorderedSorted.splice(newIndex, 0, moved);

          const reorderedNames = reorderedSorted.map((r) => r.info.full_name);
          let nameIdx = 0;
          const updatedRepos = repos.map((repo) => {
            const isPresent = reorderedNames.some(
              (name) => name.toLowerCase() === repo.toLowerCase()
            );
            return isPresent ? reorderedNames[nameIdx++] : repo;
          });
          setRepos(updatedRepos);
        } else {
          reorderRepos(active.id, over.id);
        }
      }
    }
  };

  const inFlightNpmRef = useRef(new Set());

  useEffect(() => {
    if (!reposData || reposData.length === 0) return;
    let isMounted = true;

    reposData.forEach((repo) => {
      const fullName = repo?.info?.full_name;
      if (
        fullName &&
        npmDownloads[fullName] === undefined &&
        !inFlightNpmRef.current.has(fullName)
      ) {
        inFlightNpmRef.current.add(fullName);
        fetchNpmWeeklyDownloads(fullName)
          .then((count) => {
            if (isMounted) setNpmDownloads(fullName, count);
          })
          .finally(() => {
            inFlightNpmRef.current.delete(fullName);
          });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [reposData, npmDownloads, setNpmDownloads]);

  const leaders = useMemo(() => {
    if (!reposData || reposData.length < 2) return {};
    const maxHealth = Math.max(...reposData.map((r) => r.healthScore || 0));
    const maxStars = Math.max(...reposData.map((r) => r.info.stargazers_count || 0));
    const maxCommits = Math.max(...reposData.map((r) => r.commitsLastYear || 0));
    const maxForks = Math.max(...reposData.map((r) => r.info.forks_count || 0));
    const maxWatchers = Math.max(
      ...reposData.map((r) => r.info.subscribers_count ?? r.info.watchers_count ?? 0)
    );
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
      const valA = getSortValue(a, sortKey, npmDownloads);
      const valB = getSortValue(b, sortKey, npmDownloads);
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default select-none sticky top-0 z-20 shadow-xs">
            <tr>
              <th className="px-2.5 py-2 font-semibold sticky left-0 top-0 bg-canvas-subtle z-30 border-r border-border-default min-w-[190px]">
                Repository
              </th>
              {TABLE_COLUMNS.map((col) => {
                if (!isColVisible(col.id)) return null;
                const IconComponent = col.icon;
                const baseClass = `px-2 py-2 font-semibold border-r border-border-default whitespace-nowrap ${
                  col.center ? 'text-center' : ''
                }`;

                if (col.sortable) {
                  return (
                    <th
                      key={col.id}
                      onClick={() => toggleSort(col.id)}
                      className={`${baseClass} cursor-pointer hover:text-fg-default hover:bg-canvas-inset transition-colors`}
                    >
                      {IconComponent && (
                        <IconComponent className={`mr-1 inline ${col.iconClass || ''}`} size={13} />
                      )}
                      {col.label}
                      {renderSortIndicator(col.id)}
                    </th>
                  );
                }

                return (
                  <th key={col.id} className={baseClass}>
                    {IconComponent && (
                      <IconComponent className={`mr-1 inline ${col.iconClass || ''}`} size={13} />
                    )}
                    {col.label}
                  </th>
                );
              })}
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
