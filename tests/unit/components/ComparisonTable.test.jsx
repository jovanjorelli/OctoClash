import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '../../setup.js';
import { ComparisonTable } from '../../../src/components/compare/ComparisonTable.jsx';
import { CommitSparkline } from '../../../src/components/compare/CommitSparkline.jsx';
import { HealthGradeBadge } from '../../../src/components/compare/HealthGradeBadge.jsx';
import { LatestReleaseBadge } from '../../../src/components/compare/LatestReleaseBadge.jsx';
import { LicenseBadge } from '../../../src/components/compare/LicenseBadge.jsx';
import { useAppStore } from '../../../src/store/appStore.js';

describe('ComparisonTable and extracted subcomponents', () => {
  beforeEach(() => {
    useAppStore.setState({
      repos: ['facebook/react', 'vuejs/core'],
      reposData: [
        {
          info: {
            full_name: 'facebook/react',
            name: 'react',
            html_url: 'https://github.com/facebook/react',
            language: 'JavaScript',
            stargazers_count: 220000,
            forks_count: 45000,
            open_issues_count: 850,
            size: 204800,
            owner: { avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4' },
            license: { spdx_id: 'MIT' },
          },
          healthScore: 92,
          healthGrade: 'A',
          commitsLastYear: 1200,
          commitActivity: Array.from({ length: 12 }, (_, i) => ({ total: (i + 1) * 10 })),
          latestRelease: { url: 'https://github.com/facebook/react/releases/tag/v19.0.0', tag: 'v19.0.0', daysAgo: 5 },
          licenseClassification: { label: 'MIT', type: 'permissive' },
          avgIssueTime: '3d',
          contributors: [{ login: 'gaearon', avatar_url: '', contributions: 500 }],
        },
        {
          info: {
            full_name: 'vuejs/core',
            name: 'core',
            html_url: 'https://github.com/vuejs/core',
            language: 'TypeScript',
            stargazers_count: 45000,
            forks_count: 8000,
            open_issues_count: 320,
            size: 102400,
            owner: { avatar_url: 'https://avatars.githubusercontent.com/u/6128107?v=4' },
            license: { spdx_id: 'MIT' },
          },
          healthScore: 88,
          healthGrade: 'B',
          commitsLastYear: 900,
          commitActivity: Array.from({ length: 12 }, (_, i) => ({ total: (i + 1) * 5 })),
          latestRelease: { url: 'https://github.com/vuejs/core/releases/tag/v3.5.0', tag: 'v3.5.0', daysAgo: 10 },
          licenseClassification: { label: 'MIT', type: 'permissive' },
          avgIssueTime: '2d',
          contributors: [{ login: 'yyx990803', avatar_url: '', contributions: 1000 }],
        },
      ],
      visibleColumns: {},
      npmDownloads: { 'facebook/react': 25000000, 'vuejs/core': 5000000 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Extracted Badge and Sparkline Components', () => {
    it('CommitSparkline renders SVG polyline or returns null on empty activity', () => {
      const { container: empty } = render(<CommitSparkline activity={[]} />);
      expect(empty.firstChild).toBeNull();

      const { container: filled } = render(
        <CommitSparkline activity={[{ total: 5 }, { total: 10 }]} />
      );
      const svg = filled.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg.querySelector('polyline')).not.toBeNull();
    });

    it('HealthGradeBadge handles letter grades and score correctly', () => {
      const { container } = render(<HealthGradeBadge score={95} grade="A+" />);
      expect(container.textContent).toContain('95');
      expect(container.textContent).toContain('A+');
    });

    it('LatestReleaseBadge handles timeAgo intervals', () => {
      const { container: today } = render(<LatestReleaseBadge release={{ url: '#', tag: 'v1.0.0', daysAgo: 0 }} />);
      expect(today.textContent).toContain('today');

      const { container: yearAgo } = render(<LatestReleaseBadge release={{ url: '#', tag: 'v0.9.0', daysAgo: 400 }} />);
      expect(yearAgo.textContent).toContain('1y');

      const { container: none } = render(<LatestReleaseBadge release={null} />);
      expect(none.textContent).toContain('-');
    });

    it('LicenseBadge handles copyleft and other variants', () => {
      const { container: copyleft } = render(<LicenseBadge classification={{ label: 'GPL-3.0', type: 'copyleft' }} />);
      expect(copyleft.textContent).toContain('GPL-3.0');

      const { container: other } = render(<LicenseBadge classification={{ label: 'Custom', type: 'other' }} />);
      expect(other.textContent).toContain('Custom');
    });
  });

  describe('ComparisonTable rendering and sorting', () => {
    it('renders comparison table with rows and headers', () => {
      render(<ComparisonTable />);
      expect(screen.getByText('facebook/react')).not.toBeNull();
      expect(screen.getByText('vuejs/core')).not.toBeNull();
      expect(screen.getByText('Repository')).not.toBeNull();
    });

    it('toggles sorting when sortable column header is clicked', () => {
      render(<ComparisonTable />);
      const starsHeader = screen.getByText('Stars');

      // Click to sort by stars desc
      fireEvent.click(starsHeader);
      const rowsAfterSort = screen.getAllByRole('row');
      expect(rowsAfterSort[1].textContent).toContain('facebook/react');

      // Click to sort by stars asc
      fireEvent.click(starsHeader);
      const rowsAfterAsc = screen.getAllByRole('row');
      expect(rowsAfterAsc[1].textContent).toContain('vuejs/core');
    });

    it('calls removeRepo when delete action button is clicked', () => {
      const removeSpy = vi.fn();
      useAppStore.setState({ removeRepo: removeSpy });

      render(<ComparisonTable />);
      const deleteBtn = screen.getByLabelText('Remove facebook/react');
      fireEvent.click(deleteBtn);

      expect(removeSpy).toHaveBeenCalledWith('facebook/react');
    });

    it('returns null when reposData is empty', () => {
      useAppStore.setState({ reposData: [] });
      const { container } = render(<ComparisonTable />);
      expect(container.firstChild).toBeNull();
    });
  });
});
