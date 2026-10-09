import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '../setup.js';
import { SharePanel } from '../../src/components/compare/SharePanel.jsx';
import { useAppStore } from '../../src/store/appStore.js';

describe('SharePanel unit tests', () => {
  let createdBlobs = [];
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let clickSpy;

  beforeEach(() => {
    createdBlobs = [];
    originalCreateObjectURL = globalThis.URL.createObjectURL;
    originalRevokeObjectURL = globalThis.URL.revokeObjectURL;

    globalThis.URL.createObjectURL = vi.fn((blob) => {
      createdBlobs.push(blob);
      return `blob:mock-url-${createdBlobs.length}`;
    });
    globalThis.URL.revokeObjectURL = vi.fn();

    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    useAppStore.setState({
      reposData: [],
      npmDownloads: {},
      theme: 'system',
    });
  });

  afterEach(() => {
    cleanup();
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
  });

  describe('CSV export and injection neutralization', () => {
    it('1. does not initiate CSV export when reposData is empty', () => {
      render(<SharePanel />);
      const csvBtn = screen.getByRole('button', { name: /Export CSV/i });

      fireEvent.click(csvBtn);

      expect(createdBlobs).toHaveLength(0);
      expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('2. neutralizes formula injection triggers starting with "=" by prefixing single quote', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              full_name: '=cmd|"/C calc"!A0',
              language: 'JavaScript',
              stargazers_count: 100,
              forks_count: 10,
              subscribers_count: 5,
              open_issues_count: 1,
              size: 2048,
              license: { spdx_id: 'MIT' },
            },
            commitsLastYear: 50,
            avgIssueTime: '2 days',
            healthScore: 85,
            healthGrade: 'A',
            latestRelease: { tag: 'v1.0.0' },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

      expect(createdBlobs).toHaveLength(1);
      const csvText = await createdBlobs[0].text();
      const lines = csvText.trim().split('\n');

      expect(lines[1]).toContain(`"'=cmd|""/C calc""!A0"`);
    });

    it('3. neutralizes formula injection triggers starting with "+"', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              full_name: '+12345_dangerous_formula',
              language: 'TypeScript',
              license: { spdx_id: 'MIT' },
            },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

      const csvText = await createdBlobs[0].text();
      expect(csvText).toContain(`"'+12345_dangerous_formula"`);
    });

    it('4. neutralizes formula injection triggers starting with "-"', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              full_name: '-alert(1)',
              license: { spdx_id: 'Apache-2.0' },
            },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

      const csvText = await createdBlobs[0].text();
      expect(csvText).toContain(`"'-alert(1)"`);
    });

    it('5. neutralizes formula injection triggers starting with "@"', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              full_name: '@SUM(1+1)',
              license: null,
            },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

      const csvText = await createdBlobs[0].text();
      expect(csvText).toContain(`"'@SUM(1+1)"`);
    });

    it('6. escapes internal quotes with double quotes per RFC 4180', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              full_name: 'org/repo-with-"quotes"-inside',
              license: { spdx_id: 'MIT' },
            },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

      const csvText = await createdBlobs[0].text();
      expect(csvText).toContain(`"org/repo-with-""quotes""-inside"`);
    });

    it('7. verifies CSV header row contains all 14 expected columns', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: { full_name: 'test/repo' },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

      const csvText = await createdBlobs[0].text();
      const [headerLine] = csvText.split('\n');

      const expectedHeaders = [
        'Repository',
        'Language',
        'NPM / wk',
        'Health Score',
        'Health Grade',
        'Latest Release',
        'Stars',
        'Forks',
        'Watchers',
        'Commits (1y)',
        'Open Issues',
        'Avg Issue Time',
        'Size (MB)',
        'License',
      ].join(',');

      expect(headerLine).toBe(expectedHeaders);
    });

    it('8. preserves 0 watchers without coalescing to stargazers count', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              full_name: 'test/zero-watchers',
              stargazers_count: 50000,
              watchers_count: 0,
              subscribers_count: 0,
              license: { spdx_id: 'MIT' },
            },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

      const csvText = await createdBlobs[0].text();
      const [, dataLine] = csvText.trim().split('\n');
      const cells = dataLine.split(',');

      // In row: Watchers is index 8, Stars is index 6
      expect(cells[6]).toBe('50000'); // stars
      expect(cells[8]).toBe('0'); // watchers should be 0, NOT 50000
    });
  });

  describe('JSON export structure', () => {
    it('9. does not initiate JSON export when reposData is empty', () => {
      render(<SharePanel />);
      const jsonBtn = screen.getByRole('button', { name: /Export JSON/i });

      fireEvent.click(jsonBtn);

      expect(createdBlobs).toHaveLength(0);
      expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('10. exports valid JSON matching required schema and fields', async () => {
      useAppStore.setState({
        npmDownloads: {
          'facebook/react': 25000000,
        },
        reposData: [
          {
            info: {
              name: 'react',
              full_name: 'facebook/react',
              html_url: 'https://github.com/facebook/react',
              language: 'JavaScript',
              stargazers_count: 220000,
              forks_count: 45000,
              subscribers_count: 6700,
              watchers_count: 220000,
              open_issues_count: 1200,
              size: 35000,
              license: { spdx_id: 'MIT' },
            },
            commitsLastYear: 850,
            avgIssueTime: '3 days',
            languages: { JavaScript: 80, HTML: 20 },
            healthScore: 92,
            healthGrade: 'A+',
            latestRelease: { tag: 'v18.3.0' },
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export JSON/i }));

      expect(createdBlobs).toHaveLength(1);
      const jsonText = await createdBlobs[0].text();
      const parsed = JSON.parse(jsonText);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);

      const item = parsed[0];
      expect(item).toEqual({
        name: 'react',
        full_name: 'facebook/react',
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        health_score: 92,
        health_grade: 'A+',
        latest_release: 'v18.3.0',
        stars: 220000,
        forks: 45000,
        watchers: 6700,
        commits_1y: 850,
        open_issues: 1200,
        avg_issue_resolution_time: '3 days',
        size: 35000,
        npm_downloads: 25000000,
        license: 'MIT',
        languages: { JavaScript: 80, HTML: 20 },
      });
    });

    it('11. includes null fallbacks for missing language and latest_release in JSON', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              name: 'minimal',
              full_name: 'minimal/repo',
              html_url: 'https://github.com/minimal/repo',
              language: null,
              stargazers_count: 5,
              forks_count: 1,
              subscribers_count: null,
              watchers_count: null,
              open_issues_count: 0,
              size: 100,
              license: null,
            },
            commitsLastYear: 0,
            avgIssueTime: null,
            languages: {},
            healthScore: 20,
            healthGrade: 'F',
            latestRelease: null,
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export JSON/i }));

      const jsonText = await createdBlobs[0].text();
      const [item] = JSON.parse(jsonText);

      expect(item.language).toBeNull();
      expect(item.latest_release).toBeNull();
      expect(item.license).toBe('None');
      expect(item.watchers).toBe(0);
    });

    it('12. respects nullish watchers count in JSON export when subscribers_count is 0', async () => {
      useAppStore.setState({
        reposData: [
          {
            info: {
              name: 'zero-watchers',
              full_name: 'org/zero-watchers',
              html_url: 'https://github.com/org/zero-watchers',
              stargazers_count: 3000,
              subscribers_count: 0,
              watchers_count: 3000,
            },
            languages: {},
            healthScore: 50,
            healthGrade: 'C',
          },
        ],
      });

      render(<SharePanel />);
      fireEvent.click(screen.getByRole('button', { name: /Export JSON/i }));

      const jsonText = await createdBlobs[0].text();
      const [item] = JSON.parse(jsonText);

      expect(item.watchers).toBe(0);
    });
  });
});
