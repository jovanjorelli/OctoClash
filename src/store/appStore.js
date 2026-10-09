/**
 * Global application state store powered by Zustand.
 * Handles comparison list, theme, column toggles, rate limit headers, and token management.
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { normalizeRepoFullName } from '../services/githubApi'

const normalizeRepo = (repo) => repo.trim().toLowerCase();

const toValidRepo = (repo) => {
  try {
    return normalizeRepoFullName(repo);
  } catch {
    return null;
  }
};

const areReposEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((repo, index) => normalizeRepo(repo) === normalizeRepo(b[index]));
};

/**
 * Default visibility configuration for repository comparison table columns.
 */
export const DEFAULT_VISIBLE_COLUMNS = {
  language: true,
  npm: true,
  health: true,
  release: true,
  commits: true,
  stars: true,
  forks: true,
  watchers: true,
  issues: true,
  size: true,
  fixTime: true,
  license: true,
  readme: true,
  contributors: true,
};

/**
 * Main application hook for global state.
 * Persistent fields (theme, repos, infiniteMode, visibleColumns) save to localStorage,
 * while user GitHub tokens are stored isolated in sessionStorage.
 */
export const useAppStore = create(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      token: (typeof window !== 'undefined' && window.sessionStorage?.getItem('octoclash_session_token')) || '',
      setToken: (token) => {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          if (token) {
            window.sessionStorage.setItem('octoclash_session_token', token);
          } else {
            window.sessionStorage.removeItem('octoclash_session_token');
          }
        }
        set({ token });
      },

      repos: [],
      setRepos: (repos) => set((state) => {
        const uniqueRepos = [];
        const seen = new Set();
        for (const r of repos) {
          const validRepo = toValidRepo(r);
          if (!validRepo) continue;

          const lower = normalizeRepo(validRepo);
          if (!seen.has(lower)) {
            seen.add(lower);
            uniqueRepos.push(validRepo);
          }
        }

        let reposToSet = uniqueRepos;
        if (!state.infiniteMode && reposToSet.length > 10) {
          reposToSet = reposToSet.slice(0, 10);
        }

        if (areReposEqual(state.repos, reposToSet)) {
          return state;
        }
        
        const sortedData = reposToSet.map((repo) => 
          state.reposData.find((rd) => rd?.info?.full_name?.toLowerCase() === repo.toLowerCase())
        ).filter(Boolean);
        return { repos: reposToSet, reposData: sortedData };
      }),
      addRepo: (repo, data = null) => set((state) => {
        const nextRepo = toValidRepo(repo);
        if (!nextRepo) return state;
        if (state.repos.some((existing) => normalizeRepo(existing) === normalizeRepo(nextRepo))) return state;
        if (!state.infiniteMode && state.repos.length >= 10) return state;

        const nextRepos = [...state.repos, nextRepo];
        if (data) {
          const alreadyInData = state.reposData.some(
            (rd) => rd?.info?.full_name?.toLowerCase() === nextRepo.toLowerCase()
          );
          const nextReposData = alreadyInData ? state.reposData : [...state.reposData, data];
          return { repos: nextRepos, reposData: nextReposData };
        }

        return { repos: nextRepos };
      }),
      removeRepo: (repo) => set((state) => ({
        repos: state.repos.filter(r => normalizeRepo(r) !== normalizeRepo(repo)),
        reposData: state.reposData.filter(rd => rd?.info?.full_name?.toLowerCase() !== normalizeRepo(repo))
      })),
      reorderRepos: (source, target) => set((state) => {
        const startIndex = typeof source === 'number'
          ? source
          : state.repos.findIndex(r => normalizeRepo(r) === normalizeRepo(String(source)));
        const endIndex = typeof target === 'number'
          ? target
          : state.repos.findIndex(r => normalizeRepo(r) === normalizeRepo(String(target)));

        if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) {
          return state;
        }

        if (startIndex < 0 || startIndex >= state.repos.length || endIndex < 0 || endIndex >= state.repos.length) {
          return state;
        }

        const result = Array.from(state.repos);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        const sortedData = result.map(repo => 
          state.reposData.find(rd => rd?.info?.full_name?.toLowerCase() === repo.toLowerCase())
        ).filter(Boolean);

        return { repos: result, reposData: sortedData };
      }),

      previewRepo: null,
      setPreviewRepo: (previewRepo) => set({ previewRepo }),

      settingsOpen: false,
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      toggleColumn: (colId) => set((state) => ({
        visibleColumns: {
          ...state.visibleColumns,
          [colId]: state.visibleColumns[colId] === false ? true : false,
        },
      })),
      resetColumns: () => set({ visibleColumns: DEFAULT_VISIBLE_COLUMNS }),
      setAllColumns: (visible) => set((state) => {
        const next = {};
        Object.keys(state.visibleColumns).forEach((k) => {
          next[k] = visible;
        });
        return { visibleColumns: next };
      }),

      npmDownloads: {},
      setNpmDownloads: (repoFullName, count) => set((state) => ({
        npmDownloads: {
          ...state.npmDownloads,
          [repoFullName]: count,
        },
      })),

      infiniteMode: false,
      setInfiniteMode: (infiniteMode) => set((state) => {
        if (!infiniteMode && state.repos.length > 10) {
          const trimmedRepos = state.repos.slice(0, 10);
          const trimmedReposData = state.reposData.slice(0, 10);
          return {
            infiniteMode,
            repos: trimmedRepos,
            reposData: trimmedReposData,
          };
        }
        return { infiniteMode };
      }),

      reposData: [],
      setReposData: (reposData) => set({ reposData }),

      rateLimit: null,
      setRateLimit: (rateLimit) => set({ rateLimit }),
    }),
    {
      name: 'octoclash-storage',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({ 
        theme: state.theme, 
        repos: state.repos,
        infiniteMode: state.infiniteMode,
        visibleColumns: state.visibleColumns,
      }),
    }
  )
)
