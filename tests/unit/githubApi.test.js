import { describe, it, expect } from 'vitest';
import '../setup.js';
import {
  normalizeRepoData,
  calculateHealthScore,
} from '../../src/services/githubApi.js';

// Deterministic reference timestamp: 2024-01-01T00:00:00.000Z (1704067200000 ms)
const FIXED_NOW = 1704067200000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('githubApi unit tests', () => {
  describe('normalizeRepoData', () => {
    it('1. returns predictable default structure when given minimal parameters', () => {
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/repo', stargazers_count: 10 },
        now: FIXED_NOW,
      });

      expect(result.info.full_name).toBe('test/repo');
      expect(result.languages).toEqual({});
      expect(result.commitActivity).toEqual([]);
      expect(result.commitsLastYear).toBe(0);
      expect(result.contributors).toEqual([]);
      expect(result.avgIssueTime).toBeNull();
      expect(result.latestRelease).toBeNull();
      expect(typeof result.healthScore).toBe('number');
      expect(typeof result.healthGrade).toBe('string');
      expect(result.licenseClassification.type).toBe('unlicensed');
    });

    it('2. aggregates commitsLastYear accurately from weekly totals', () => {
      const commitActivityRaw = [
        { total: 10 },
        { total: '25' },
        { total: 0 },
        { total: null },
        { total: 15 },
      ];
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/commits' },
        commitActivityRaw,
        now: FIXED_NOW,
      });

      expect(result.commitsLastYear).toBe(50);
      expect(result.commitActivity).toHaveLength(5);
    });

    it('3. normalizes null and non-object languages to empty object', () => {
      const nullLang = normalizeRepoData({ repoInfo: {}, languages: null, now: FIXED_NOW });
      const strLang = normalizeRepoData({ repoInfo: {}, languages: 'invalid', now: FIXED_NOW });
      const validLang = normalizeRepoData({ repoInfo: {}, languages: { JavaScript: 5000 }, now: FIXED_NOW });

      expect(nullLang.languages).toEqual({});
      expect(strLang.languages).toEqual({});
      expect(validLang.languages).toEqual({ JavaScript: 5000 });
    });

    it('4. computes avgIssueTime as "< 1 day" when issue resolved within same day', () => {
      const issues = [
        {
          pull_request: null,
          created_at: new Date(FIXED_NOW - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          closed_at: new Date(FIXED_NOW).toISOString(),
        },
      ];
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/fast-issues' },
        issues,
        now: FIXED_NOW,
      });

      expect(result.avgIssueTime).toBe('< 1 day');
    });

    it('5. computes avgIssueTime for multi-day resolutions and filters out pull requests', () => {
      const issues = [
        {
          pull_request: null,
          created_at: new Date(FIXED_NOW - ONE_DAY_MS * 6).toISOString(),
          closed_at: new Date(FIXED_NOW).toISOString(), // 6 days
        },
        {
          pull_request: null,
          created_at: new Date(FIXED_NOW - ONE_DAY_MS * 4).toISOString(),
          closed_at: new Date(FIXED_NOW).toISOString(), // 4 days
        },
        {
          pull_request: { url: 'https://api.github.com/repos/test/repo/pulls/1' },
          created_at: new Date(FIXED_NOW - ONE_DAY_MS * 100).toISOString(),
          closed_at: new Date(FIXED_NOW).toISOString(), // Should be ignored
        },
      ];
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/multi-day' },
        issues,
        now: FIXED_NOW,
      });

      // Average of 6 and 4 days is 5 days
      expect(result.avgIssueTime).toBe('5 days');
    });

    it('6. normalizes release object and computes deterministic daysAgo', () => {
      const releaseRaw = {
        tag_name: 'v1.5.0',
        name: 'Version 1.5.0',
        published_at: new Date(FIXED_NOW - ONE_DAY_MS * 5).toISOString(),
        html_url: 'https://github.com/test/repo/releases/v1.5.0',
      };
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/repo', html_url: 'https://github.com/test/repo' },
        releaseRaw,
        now: FIXED_NOW,
      });

      expect(result.latestRelease).toEqual({
        tag: 'v1.5.0',
        name: 'Version 1.5.0',
        publishedAt: releaseRaw.published_at,
        daysAgo: 5,
        url: 'https://github.com/test/repo/releases/v1.5.0',
      });
    });

    it('7. falls back to tags array format when release tag_name is not provided', () => {
      const releaseRaw = [
        { name: 'v0.9.0' },
      ];
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/repo', html_url: 'https://github.com/test/repo' },
        releaseRaw,
        now: FIXED_NOW,
      });

      expect(result.latestRelease).toEqual({
        tag: 'v0.9.0',
        name: 'v0.9.0',
        publishedAt: null,
        daysAgo: null,
        url: 'https://github.com/test/repo/releases/tag/v0.9.0',
      });
    });

    it('8. classifies license properly and passes it into normalized result', () => {
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/repo', license: { spdx_id: 'MIT' } },
        now: FIXED_NOW,
      });

      expect(result.licenseClassification).toEqual({
        type: 'permissive',
        label: 'MIT',
        risk: 'low',
      });
    });
  });

  describe('calculateHealthScore', () => {
    it('9. returns 0 score and grade F when repoInfo is omitted', () => {
      const result = calculateHealthScore({ now: FIXED_NOW });
      expect(result).toEqual({ score: 0, grade: 'F' });
    });

    it('10. returns parsed days fallback when repoInfo is absent but avgIssueTime provided', () => {
      expect(calculateHealthScore({ avgIssueTime: '< 1 day' })).toBe(0.5);
      expect(calculateHealthScore({ avgIssueTime: '12 days' })).toBe(12);
      expect(calculateHealthScore({ avgIssueTime: 'no digits' })).toBe(30);
    });

    it('11. awards high score (grade A/A+) to active, popular repository with recent commits', () => {
      const result = calculateHealthScore({
        repoInfo: {
          pushed_at: new Date(FIXED_NOW - ONE_DAY_MS * 2).toISOString(), // <=7 days: +30
          archived: false,
          disabled: false, // +5
          license: { spdx_id: 'Apache-2.0' }, // +5
        },
        commitsLastYear: 400, // +15
        commitActivity: Array.from({ length: 10 }, () => ({ total: 5 })), // recent 4 weeks: +10
        avgIssueTime: '< 1 day', // <=3 days: +25
        contributors: Array.from({ length: 5 }, (_, i) => ({ id: i })), // +10
        now: FIXED_NOW,
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.grade).toBe('A+');
    });

    it('12. heavily penalizes archived repositories capping score at 35 (Grade F)', () => {
      const result = calculateHealthScore({
        repoInfo: {
          pushed_at: new Date(FIXED_NOW - ONE_DAY_MS * 1).toISOString(),
          archived: true,
          disabled: false,
          license: { spdx_id: 'MIT' },
        },
        commitsLastYear: 500,
        commitActivity: [{ total: 20 }],
        avgIssueTime: '2 days',
        contributors: [1, 2, 3, 4, 5],
        now: FIXED_NOW,
      });

      expect(result.score).toBeLessThanOrEqual(35);
      expect(result.grade).toBe('F');
    });

    it('13. heavily penalizes disabled repositories capping score at 35 (Grade F)', () => {
      const result = calculateHealthScore({
        repoInfo: {
          pushed_at: new Date(FIXED_NOW - ONE_DAY_MS * 1).toISOString(),
          archived: false,
          disabled: true,
          license: { spdx_id: 'MIT' },
        },
        commitsLastYear: 500,
        now: FIXED_NOW,
      });

      expect(result.score).toBeLessThanOrEqual(35);
      expect(result.grade).toBe('F');
    });

    it('14. applies recency decay tiers for push timestamps', () => {
      const makeScore = (daysAgo) => calculateHealthScore({
        repoInfo: {
          pushed_at: new Date(FIXED_NOW - ONE_DAY_MS * daysAgo).toISOString(),
          archived: false,
        },
        now: FIXED_NOW,
      }).score;

      const score7d = makeScore(5);
      const score30d = makeScore(20);
      const score90d = makeScore(60);
      const score180d = makeScore(120);
      const scoreOld = makeScore(250);

      expect(score7d).toBeGreaterThan(score30d);
      expect(score30d).toBeGreaterThan(score90d);
      expect(score90d).toBeGreaterThan(score180d);
      expect(score180d).toBeGreaterThan(scoreOld);
    });

    it('15. awards 15 issue points when repository explicitly has issues disabled', () => {
      const result = calculateHealthScore({
        repoInfo: {
          pushed_at: new Date(FIXED_NOW).toISOString(),
          has_issues: false,
          archived: false,
        },
        now: FIXED_NOW,
      });

      expect(result.score).toBe(30 + 5 + 15); // 30 (recent push) + 5 (not archived) + 15 (no issues enabled)
    });
  });

  describe('safeDateMs behavior (valid / null / invalid inputs)', () => {
    it('16. handles valid ISO date string deterministically without epoch drift', () => {
      const validDate = '2023-12-25T00:00:00.000Z';
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/valid-date' },
        releaseRaw: { tag_name: 'v1.0.0', published_at: validDate },
        now: FIXED_NOW,
      });

      expect(result.latestRelease.publishedAt).toBe(validDate);
      expect(result.latestRelease.daysAgo).toBe(7); // 7 days prior to 2024-01-01
    });

    it('17. handles null published_at explicitly without reverting to Unix epoch (prevents 20000+ days ago)', () => {
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/null-release' },
        releaseRaw: { tag_name: 'v1.0.0', published_at: null },
        now: FIXED_NOW,
      });

      expect(result.latestRelease.publishedAt).toBeNull();
      expect(result.latestRelease.daysAgo).toBeNull();
    });

    it('18. handles undefined published_at as null daysAgo', () => {
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/undefined-release' },
        releaseRaw: { tag_name: 'v1.0.0', published_at: undefined },
        now: FIXED_NOW,
      });

      expect(result.latestRelease.publishedAt).toBeNull();
      expect(result.latestRelease.daysAgo).toBeNull();
    });

    it('19. handles empty string published_at as null daysAgo', () => {
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/empty-string-release' },
        releaseRaw: { tag_name: 'v1.0.0', published_at: '' },
        now: FIXED_NOW,
      });

      expect(result.latestRelease.publishedAt).toBeNull();
      expect(result.latestRelease.daysAgo).toBeNull();
    });

    it('20. handles malformed/invalid date strings without throwing NaN or crashing', () => {
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/invalid-date-release' },
        releaseRaw: { tag_name: 'v1.0.0', published_at: 'not-a-valid-date-string' },
        now: FIXED_NOW,
      });

      expect(result.latestRelease.daysAgo).toBeNull();
    });

    it('21. treats epoch 0 (1970-01-01T00:00:00.000Z) or negative timestamps as invalid null date', () => {
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/epoch-zero' },
        releaseRaw: { tag_name: 'v1.0.0', published_at: '1970-01-01T00:00:00.000Z' },
        now: FIXED_NOW,
      });

      expect(result.latestRelease.daysAgo).toBeNull();
    });

    it('22. safely filters out issues with null or invalid created_at / closed_at', () => {
      const issues = [
        { pull_request: null, created_at: null, closed_at: '2024-01-01T00:00:00Z' },
        { pull_request: null, created_at: '2024-01-01T00:00:00Z', closed_at: null },
        { pull_request: null, created_at: 'corrupted', closed_at: '2024-01-01T00:00:00Z' },
        { pull_request: null, created_at: '2024-01-05T00:00:00Z', closed_at: '2024-01-01T00:00:00Z' }, // closed before created
      ];
      const result = normalizeRepoData({
        repoInfo: { full_name: 'test/bad-issue-dates' },
        issues,
        now: FIXED_NOW,
      });

      expect(result.avgIssueTime).toBeNull();
    });

    it('23. handles null or invalid pushed_at in calculateHealthScore without producing NaN score', () => {
      const scoreNull = calculateHealthScore({
        repoInfo: { pushed_at: null, updated_at: null, archived: false },
        now: FIXED_NOW,
      });
      const scoreInvalid = calculateHealthScore({
        repoInfo: { pushed_at: 'invalid-date', updated_at: undefined, archived: false },
        now: FIXED_NOW,
      });

      expect(Number.isFinite(scoreNull.score)).toBe(true);
      expect(Number.isFinite(scoreInvalid.score)).toBe(true);
      expect(scoreNull.score).toBeGreaterThanOrEqual(0);
      expect(scoreInvalid.score).toBeGreaterThanOrEqual(0);
    });
  });
});
