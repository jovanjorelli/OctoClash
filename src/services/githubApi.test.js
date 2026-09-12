import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  clearSharedGitHubApiCache,
  createGitHubApiClient,
  normalizeRepoData,
  normalizeRepoFullName,
  calculateHealthScore,
  classifyLicense,
} from './githubApi';

function response(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => headers[name] ?? null,
    },
    json: async () => body,
    text: async () => String(body),
  };
}

function createStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe('githubApi service', () => {
  beforeEach(() => {
    clearSharedGitHubApiCache();
  });

  it('normalizes supported GitHub repository inputs', () => {
    expect(normalizeRepoFullName(' facebook/react ')).toBe('facebook/react');
    expect(normalizeRepoFullName('https://github.com/vitejs/vite.git')).toBe('vitejs/vite');
    expect(normalizeRepoFullName('git@github.com:owner-name/repo_name.git')).toBe('owner-name/repo_name');
  });

  it('rejects repository names that would create unsafe API paths', () => {
    expect(() => normalizeRepoFullName('../react')).toThrow('invalidRepo');
    expect(() => normalizeRepoFullName('facebook/react/issues')).toThrow('invalidRepo');
    expect(() => normalizeRepoFullName('face book/react')).toThrow('invalidRepo');
  });

  it('normalizes repository payloads and computes health score, release and license', () => {
    const result = normalizeRepoData({
      repoInfo: {
        full_name: 'owner/repo',
        pushed_at: new Date(Date.now() - 86400000).toISOString(),
        license: { spdx_id: 'MIT' },
        archived: false,
        disabled: false,
      },
      languages: null,
      commitActivityRaw: [{ total: 2 }, { total: '3' }, { total: null }],
      contributors: [{ login: 'alice' }, { login: 'bob' }],
      issues: [
        { created_at: '2024-01-01T00:00:00Z', closed_at: '2024-01-03T00:00:00Z' },
        { created_at: 'bad', closed_at: '2024-01-03T00:00:00Z' },
        { created_at: '2024-01-01T00:00:00Z', closed_at: '2023-01-01T00:00:00Z' },
        { pull_request: {}, created_at: '2024-01-01T00:00:00Z', closed_at: '2024-01-03T00:00:00Z' },
      ],
      releaseRaw: { tag_name: 'v2.0.0', published_at: new Date(Date.now() - 172800000).toISOString() },
    });

    expect(result.languages).toEqual({});
    expect(result.commitsLastYear).toBe(5);
    expect(result.contributors.length).toBe(2);
    expect(result.avgIssueTime).toBe('2 days');
    expect(result.latestRelease?.tag).toBe('v2.0.0');
    expect(result.latestRelease?.daysAgo).toBe(2);
    expect(result.licenseClassification?.type).toBe('permissive');
    expect(result.healthScore).toBeGreaterThan(40);
  });

  it('correctly classifies permissive, copyleft, and unlicensed projects', () => {
    expect(classifyLicense({ spdx_id: 'MIT' }).type).toBe('permissive');
    expect(classifyLicense({ spdx_id: 'Apache-2.0' }).type).toBe('permissive');
    expect(classifyLicense({ spdx_id: 'BSD-3-Clause' }).type).toBe('permissive');
    expect(classifyLicense({ spdx_id: 'GPL-3.0' }).type).toBe('copyleft');
    expect(classifyLicense({ spdx_id: 'AGPL-3.0' }).type).toBe('copyleft');
    expect(classifyLicense(null).type).toBe('unlicensed');
    expect(classifyLicense({ spdx_id: 'NOASSERTION' }).type).toBe('unlicensed');
  });

  it('calculates health score rewarding recency and penalizing archived repos', () => {
    const active = calculateHealthScore({
      repoInfo: { pushed_at: new Date().toISOString(), license: { spdx_id: 'MIT' }, archived: false },
      commitsLastYear: 800,
      commitActivity: Array.from({ length: 12 }, () => ({ total: 10 })),
      avgIssueTime: '2 days',
      contributors: [1, 2, 3, 4, 5],
    });
    expect(active.score).toBeGreaterThanOrEqual(80);
    expect(['A+', 'A']).toContain(active.grade);

    const abandoned = calculateHealthScore({
      repoInfo: { pushed_at: '2020-01-01T00:00:00Z', license: null, archived: true },
      commitsLastYear: 0,
      commitActivity: [],
      avgIssueTime: null,
      contributors: [],
    });
    expect(abandoned.score).toBeLessThanOrEqual(35);
    expect(abandoned.grade).toBe('F');
  });

  it('caches anonymous repository data in storage and memory', async () => {
    const storage = createStorage();
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith('/languages')) return response({ JavaScript: 100 });
      if (url.endsWith('/stats/commit_activity')) return response([{ total: 7 }]);
      if (url.includes('/contributors')) return response([{ login: 'dev' }]);
      if (url.includes('/issues')) return response([]);
      if (url.includes('/releases/latest')) return response({ tag_name: 'v1.0.0' });
      return response({ full_name: 'facebook/react', name: 'react' });
    });

    const client = createGitHubApiClient({ fetchImpl, storage, now: () => 10_000 });
    const first = await client.fetchRepoData('Facebook/React');
    const second = await client.fetchRepoData('facebook/react');

    expect(first).toEqual(second);
    expect(first.commitsLastYear).toBe(7);
    expect(first.latestRelease?.tag).toBe('v1.0.0');
    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(storage.length).toBe(1);
  });

  it('keeps authenticated responses out of persistent storage', async () => {
    const storage = createStorage();
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith('/languages')) return response({});
      if (url.endsWith('/stats/commit_activity')) return response([]);
      if (url.includes('/contributors')) return response([]);
      if (url.includes('/issues')) return response([]);
      if (url.includes('/releases/latest')) return response(null, { status: 404 });
      if (url.includes('/tags')) return response([]);
      return response({ full_name: 'private/repo', name: 'repo' });
    });

    const client = createGitHubApiClient({ token: 'secret-token', fetchImpl, storage });
    await client.fetchRepoData('private/repo');

    expect(storage.length).toBe(0);
  });

  it('emits rate limit telemetry headers to callback', async () => {
    const telemetry = [];
    const fetchImpl = vi.fn(async () => response({ full_name: 'owner/repo' }, {
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '42',
        'X-RateLimit-Reset': '1700000000',
      },
    }));

    const client = createGitHubApiClient({
      fetchImpl,
      storage: null,
      onRateLimit: (data) => telemetry.push(data),
    });

    await client.fetchRepoData('owner/repo');
    expect(telemetry.length).toBeGreaterThanOrEqual(1);
    expect(telemetry[0]).toEqual({
      remaining: 42,
      limit: 60,
      reset: 1700000000,
    });
  });

  it('retries 202 responses with backoff before returning data', async () => {
    const sleeps = [];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response({}, { status: 202 }))
      .mockResolvedValueOnce(response({}, { status: 202 }))
      .mockResolvedValueOnce(response({ items: [{ full_name: 'owner/repo' }] }));

    const client = createGitHubApiClient({
      fetchImpl,
      storage: null,
      sleep: async (ms) => sleeps.push(ms),
    });

    const results = await client.searchRepos('owner');

    expect(results).toEqual([{ full_name: 'owner/repo' }]);
    expect(sleeps).toEqual([1000, 2000]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('surfaces rate limits and does not cache failed searches', async () => {
    const storage = createStorage();
    const fetchImpl = vi.fn(async () => response({}, {
      status: 403,
      headers: { 'X-RateLimit-Remaining': '0' },
    }));
    const client = createGitHubApiClient({ fetchImpl, storage });

    await expect(client.searchRepos('react')).rejects.toThrow('rateLimit');

    expect(storage.length).toBe(0);
  });

  it('generates multi-year star history curve anchored to createdAt', async () => {
    const fetchImpl = vi.fn(async () => response([]));
    const client = createGitHubApiClient({ fetchImpl, storage: null });

    const history = await client.fetchStarHistory('facebook/react', 50000, '2013-05-29T00:00:00Z');

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].stars).toBe(0);
    expect(history[0].date).toBe('2013-05-29T00:00:00Z');
    expect(history[history.length - 1].stars).toBe(50000);
  });
});
