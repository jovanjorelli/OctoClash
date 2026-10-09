import { describe, it, expect, beforeEach } from 'vitest';
import '../setup.js';
import { useAppStore } from '../../src/store/appStore.js';

describe('appStore unit tests', () => {
  beforeEach(() => {
    // Reset store state between tests
    useAppStore.setState({
      repos: [],
      reposData: [],
      infiniteMode: false,
      npmDownloads: {},
      theme: 'system',
    });
  });

  describe('addRepo state transitions', () => {
    it('1. adds a normalized repository to the repos list', () => {
      useAppStore.getState().addRepo('facebook/react');
      expect(useAppStore.getState().repos).toEqual(['facebook/react']);
    });

    it('2. normalizes full GitHub URLs and SSH clones to owner/repo format', () => {
      useAppStore.getState().addRepo('https://github.com/vuejs/core.git');
      useAppStore.getState().addRepo('git@github.com:vercel/next.js.git');

      expect(useAppStore.getState().repos).toEqual(['vuejs/core', 'vercel/next.js']);
    });

    it('3. rejects invalid repository formats without altering state', () => {
      useAppStore.getState().addRepo('invalid-repo-name');
      useAppStore.getState().addRepo('../path-traversal');
      useAppStore.getState().addRepo('owner/repo/extra/parts');
      useAppStore.getState().addRepo('');

      expect(useAppStore.getState().repos).toEqual([]);
    });

    it('4. prevents duplicate additions case-insensitively', () => {
      useAppStore.getState().addRepo('facebook/react');
      useAppStore.getState().addRepo('Facebook/React');
      useAppStore.getState().addRepo('FACEBOOK/REACT');

      expect(useAppStore.getState().repos).toHaveLength(1);
      expect(useAppStore.getState().repos[0]).toBe('facebook/react');
    });

    it('5. atomically adds repository and pre-fetched reposData when payload provided', () => {
      const mockData = { info: { full_name: 'facebook/react', stargazers_count: 220000 } };
      useAppStore.getState().addRepo('facebook/react', mockData);

      expect(useAppStore.getState().repos).toEqual(['facebook/react']);
      expect(useAppStore.getState().reposData).toHaveLength(1);
      expect(useAppStore.getState().reposData[0].info.full_name).toBe('facebook/react');
    });

    it('6. prevents duplicate reposData entries for existing repositories', () => {
      const data1 = { info: { full_name: 'facebook/react', v: 1 } };
      const data2 = { info: { full_name: 'facebook/react', v: 2 } };

      useAppStore.getState().addRepo('facebook/react', data1);
      useAppStore.getState().addRepo('facebook/react', data2);

      expect(useAppStore.getState().reposData).toHaveLength(1);
      expect(useAppStore.getState().reposData[0].info.v).toBe(1);
    });

    it('7. enforces 10-repository ceiling when infiniteMode is false', () => {
      for (let i = 1; i <= 12; i++) {
        useAppStore.getState().addRepo(`owner/repo-${i}`);
      }

      expect(useAppStore.getState().repos).toHaveLength(10);
      expect(useAppStore.getState().repos).not.toContain('owner/repo-11');
      expect(useAppStore.getState().repos).not.toContain('owner/repo-12');
    });

    it('8. permits more than 10 repositories when infiniteMode is true', () => {
      useAppStore.getState().setInfiniteMode(true);

      for (let i = 1; i <= 15; i++) {
        useAppStore.getState().addRepo(`owner/repo-${i}`);
      }

      expect(useAppStore.getState().repos).toHaveLength(15);
      expect(useAppStore.getState().repos[14]).toBe('owner/repo-15');
    });
  });

  describe('removeRepo state transitions', () => {
    it('9. removes target repository from repos and reposData case-insensitively', () => {
      useAppStore.setState({
        repos: ['facebook/react', 'vuejs/core', 'sveltejs/svelte'],
        reposData: [
          { info: { full_name: 'facebook/react' } },
          { info: { full_name: 'vuejs/core' } },
          { info: { full_name: 'sveltejs/svelte' } },
        ],
      });

      useAppStore.getState().removeRepo('VueJS/Core');

      expect(useAppStore.getState().repos).toEqual(['facebook/react', 'sveltejs/svelte']);
      expect(useAppStore.getState().reposData.map((d) => d.info.full_name)).toEqual([
        'facebook/react',
        'sveltejs/svelte',
      ]);
    });

    it('10. acts as a safe no-op when removing non-existent repository', () => {
      useAppStore.setState({ repos: ['facebook/react'] });
      useAppStore.getState().removeRepo('unknown/nonexistent');

      expect(useAppStore.getState().repos).toEqual(['facebook/react']);
    });
  });

  describe('reorderRepos state transitions', () => {
    it('11. reorders repositories by numeric index and aligns reposData', () => {
      useAppStore.setState({
        repos: ['a/a', 'b/b', 'c/c'],
        reposData: [
          { info: { full_name: 'a/a' } },
          { info: { full_name: 'b/b' } },
          { info: { full_name: 'c/c' } },
        ],
      });

      // Move 'c/c' (index 2) to the front (index 0)
      useAppStore.getState().reorderRepos(2, 0);

      expect(useAppStore.getState().repos).toEqual(['c/c', 'a/a', 'b/b']);
      expect(useAppStore.getState().reposData.map((d) => d.info.full_name)).toEqual([
        'c/c',
        'a/a',
        'b/b',
      ]);
    });

    it('12. reorders repositories by string identifiers and aligns reposData', () => {
      useAppStore.setState({
        repos: ['react/react', 'vuejs/vue', 'angular/angular'],
        reposData: [
          { info: { full_name: 'react/react' } },
          { info: { full_name: 'vuejs/vue' } },
          { info: { full_name: 'angular/angular' } },
        ],
      });

      // Move react to index of angular
      useAppStore.getState().reorderRepos('react/react', 'angular/angular');

      expect(useAppStore.getState().repos).toEqual(['vuejs/vue', 'angular/angular', 'react/react']);
      expect(useAppStore.getState().reposData.map((d) => d.info.full_name)).toEqual([
        'vuejs/vue',
        'angular/angular',
        'react/react',
      ]);
    });

    it('13. acts as a no-op when reorder indices are out of bounds or identical', () => {
      const initialRepos = ['a/a', 'b/b'];
      useAppStore.setState({ repos: initialRepos });

      useAppStore.getState().reorderRepos(0, 0); // identical
      expect(useAppStore.getState().repos).toEqual(initialRepos);

      useAppStore.getState().reorderRepos(-1, 1); // out of bounds
      expect(useAppStore.getState().repos).toEqual(initialRepos);

      useAppStore.getState().reorderRepos(0, 10); // out of bounds
      expect(useAppStore.getState().repos).toEqual(initialRepos);

      useAppStore.getState().reorderRepos('nonexistent/repo', 'a/a');
      expect(useAppStore.getState().repos).toEqual(initialRepos);
    });
  });

  describe('infiniteMode toggling transitions', () => {
    it('14. truncates excess repos and reposData to 10 when disabling infiniteMode', () => {
      const fifteenRepos = Array.from({ length: 15 }, (_, i) => `org/repo-${i + 1}`);
      const fifteenData = fifteenRepos.map((r) => ({ info: { full_name: r } }));

      useAppStore.setState({
        infiniteMode: true,
        repos: fifteenRepos,
        reposData: fifteenData,
      });

      useAppStore.getState().setInfiniteMode(false);

      expect(useAppStore.getState().infiniteMode).toBe(false);
      expect(useAppStore.getState().repos).toHaveLength(10);
      expect(useAppStore.getState().reposData).toHaveLength(10);
      expect(useAppStore.getState().repos[9]).toBe('org/repo-10');
    });
  });
});
