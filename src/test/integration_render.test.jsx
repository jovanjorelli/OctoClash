import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import App from '../App';
import { useAppStore } from '../store/appStore';
import { clearSharedGitHubApiCache } from '../services/githubApi';

function createMockRepoData(fullName, stars = 50000, forks = 10000, commits = 1200) {
  const [_owner, name] = fullName.split('/');
  return {
    info: {
      id: Math.floor(Math.random() * 100000),
      name,
      full_name: fullName,
      html_url: `https://github.com/${fullName}`,
      created_at: '2015-01-01T00:00:00Z',
      pushed_at: '2026-09-01T00:00:00Z',
      stargazers_count: stars,
      forks_count: forks,
      watchers_count: stars,
      subscribers_count: 3000,
      open_issues_count: 250,
      license: { spdx_id: 'MIT' },
    },
    languages: {
      TypeScript: 600000,
      JavaScript: 300000,
      HTML: 50000,
    },
    commitActivity: Array.from({ length: 52 }, (_, i) => ({
      week: 1700000000 + i * 604800,
      total: Math.floor(commits / 52),
    })),
    commitsLastYear: commits,
    contributors: [
      { login: 'contributor1', avatar_url: 'https://example.com/1.png', html_url: 'https://github.com/c1' },
      { login: 'contributor2', avatar_url: 'https://example.com/2.png', html_url: 'https://github.com/c2' },
    ],
    avgIssueTime: '4 days',
    healthScore: 92,
    healthGrade: 'A+',
    latestRelease: {
      tag: 'v18.2.0',
      name: 'v18.2.0',
      publishedAt: '2026-08-01T00:00:00Z',
      daysAgo: 30,
      url: `https://github.com/${fullName}/releases`,
    },
    licenseClassification: {
      type: 'permissive',
      label: 'MIT',
      risk: 'low',
    },
  };
}

describe('Full App Integration & Visual Flow', () => {
  beforeEach(() => {
    clearSharedGitHubApiCache();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    useAppStore.setState({
      theme: 'system',
      token: '',
      repos: [],
      reposData: [],
      previewRepo: null,
      infiniteMode: false,
      settingsOpen: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders initial empty state with branding and controls', () => {
    const { container } = render(<App />);
    expect(screen.getAllByText('OctoClash').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('No repositories added yet')).toBeDefined();
    expect(screen.getByPlaceholderText(/owner\/repo \(e\.g\., facebook\/react\)/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Add/i })).toBeDefined();
    expect(container.querySelector('header')).toBeDefined();
    expect(container.querySelector('footer')).toBeDefined();
  });

  it('toggles themes smoothly via header controls', () => {
    render(<App />);

    const lightBtn = screen.getByRole('button', { name: /Light/i });
    fireEvent.click(lightBtn);
    expect(useAppStore.getState().theme).toBe('light');

    const darkBtn = screen.getByRole('button', { name: /Dark/i });
    fireEvent.click(darkBtn);
    expect(useAppStore.getState().theme).toBe('dark');

    const systemBtn = screen.getByRole('button', { name: /System/i });
    fireEvent.click(systemBtn);
    expect(useAppStore.getState().theme).toBe('system');
  });

  it('renders comparison table when repositories are populated', async () => {
    const reactData = createMockRepoData('facebook/react', 220000, 45000, 1500);
    const vueData = createMockRepoData('vuejs/core', 45000, 8000, 950);

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => {
      if (url.includes('facebook/react')) return { ok: true, json: async () => reactData.info };
      if (url.includes('vuejs/core')) return { ok: true, json: async () => vueData.info };
      return { ok: true, json: async () => ({}) };
    }));

    render(<App />);

    act(() => {
      useAppStore.setState({
        repos: ['facebook/react', 'vuejs/core'],
        reposData: [reactData, vueData],
        rateLimit: { remaining: 54, limit: 60, reset: Math.floor(Date.now() / 1000) + 1200 },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Table View' })).toBeDefined();
      expect(screen.getByRole('tab', { name: 'Charts View' })).toBeDefined();
      expect(screen.getAllByText('facebook/react').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('vuejs/core').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Health Score')).toBeDefined();
      expect(screen.getByText('Latest Release')).toBeDefined();
      expect(screen.getAllByText('v18.2.0').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('MIT').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/API Quota: 54 \/ 60/)).toBeDefined();
    });
  });

  it('switches to charts view successfully and mounts chart modules', async () => {
    const reactData = createMockRepoData('facebook/react', 220000, 45000, 1500);
    const vueData = createMockRepoData('vuejs/core', 45000, 8000, 950);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => '100' },
      json: async () => ([]),
      text: async () => '',
    }));

    render(<App />);

    act(() => {
      useAppStore.setState({
        repos: ['facebook/react', 'vuejs/core'],
        reposData: [reactData, vueData],
      });
    });

    const chartsTab = await screen.findByRole('tab', { name: 'Charts View' });
    fireEvent.click(chartsTab);

    await waitFor(() => {
      expect(screen.getByText('Language Breakdown by Repository')).toBeDefined();
      expect(screen.getByText('Data Summary')).toBeDefined();
      expect(screen.getByText('Top Contributors by Repository')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('opens and closes README modal with Escape key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => '100' },
      text: async () => '<h1>React Documentation</h1><p>A declarative UI library.</p>',
    }));

    render(<App />);

    act(() => {
      useAppStore.setState({
        repos: ['facebook/react'],
        reposData: [createMockRepoData('facebook/react')],
        previewRepo: 'facebook/react',
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('(facebook/react)')).toBeDefined();
    }, { timeout: 3000 });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(useAppStore.getState().previewRepo).toBeNull();
    });
  });
});
