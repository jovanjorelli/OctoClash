import process from 'node:process';
import { describe, it, expect, beforeAll } from 'vitest';
import '../setup.js';
import { createGitHubApiClient } from '../../src/services/githubApi.js';
import { fetchNpmWeeklyDownloads, clearNpmCache } from '../../src/services/npmApi.js';

const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN || '';
const hasToken = Boolean(GITHUB_TOKEN && GITHUB_TOKEN.trim().length > 0);

describe('API integration tests (real network)', () => {
  beforeAll(() => {
    clearNpmCache();
    if (!hasToken) {
      console.warn('\n[INTEGRATION WARNING] process.env.VITE_GITHUB_TOKEN is missing.');
      console.warn('Real GitHub API integration tests are being skipped cleanly.\n');
    }
  });

  describe('Real GitHub API with token from .env', () => {
    it.skipIf(!hasToken)('1. fetches real facebook/react repository data and validates payload', async () => {
      const client = createGitHubApiClient({ token: GITHUB_TOKEN });
      const repoData = await client.fetchRepoData('facebook/react');

      expect(repoData).toBeDefined();
      expect(repoData.info).toBeDefined();
      expect(repoData.info.name).toBe('react');
      expect(['facebook/react', 'react/react']).toContain(repoData.info.full_name);
      expect(typeof repoData.info.stargazers_count).toBe('number');
      expect(repoData.info.stargazers_count).toBeGreaterThan(50000);

      // Health metrics and licensing
      expect(typeof repoData.healthScore).toBe('number');
      expect(repoData.healthScore).toBeGreaterThanOrEqual(0);
      expect(repoData.healthScore).toBeLessThanOrEqual(100);
      expect(typeof repoData.healthGrade).toBe('string');
      expect(['A+', 'A', 'B', 'C', 'D', 'F']).toContain(repoData.healthGrade);
      expect(repoData.licenseClassification).toBeDefined();
      expect(typeof repoData.licenseClassification.type).toBe('string');

      // Languages
      expect(typeof repoData.languages).toBe('object');
      expect(repoData.languages).not.toBeNull();
    }, 15000);

    it.skipIf(!hasToken)('2. handles invalid repository gracefully on GitHub API without crashing', async () => {
      const client = createGitHubApiClient({ token: GITHUB_TOKEN });

      // Non-existent repo should cleanly throw notFound error without crashing
      await expect(
        client.fetchRepoData('nonexistent-owner-abc-99999/nonexistent-repo-xyz-99999')
      ).rejects.toThrow('notFound');
    }, 15000);

    it.skipIf(!hasToken)('3. fetches star history curve for facebook/react with real API', async () => {
      const client = createGitHubApiClient({ token: GITHUB_TOKEN });
      const history = await client.fetchStarHistory('facebook/react', 50000, '2013-05-29T00:00:00Z');

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].stars).toBe(0);

      // Verify star history is monotonically non-decreasing
      for (let i = 1; i < history.length; i++) {
        expect(history[i].stars).toBeGreaterThanOrEqual(history[i - 1].stars);
      }
    }, 15000);
  });

  describe('Real NPM API downloads', () => {
    it('4. fetches real weekly downloads for react package from NPM registry', async () => {
      const downloads = await fetchNpmWeeklyDownloads('facebook/react');

      expect(typeof downloads).toBe('number');
      expect(downloads).toBeGreaterThan(1_000_000);
    }, 15000);

    it('5. handles non-existent npm package gracefully without crashing', async () => {
      const result = await fetchNpmWeeklyDownloads('nonexistent-org-12345/nonexistent-package-xyz-99999');

      expect(result).toBeNull();
    }, 15000);
  });
});
