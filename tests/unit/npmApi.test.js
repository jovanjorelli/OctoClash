import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../setup.js';
import {
  fetchNpmWeeklyDownloads,
  inferNpmPackageName,
  formatNpmDownloads,
  clearNpmCache,
  npmMemoryCache,
  MEMORY_CACHE_LIMIT,
} from '../../src/services/npmApi.js';

function createMockStorage() {
  const map = new Map();
  return {
    getItem: vi.fn((key) => map.get(key) ?? null),
    setItem: vi.fn((key, value) => map.set(key, String(value))),
    removeItem: vi.fn((key) => map.delete(key)),
    clear: vi.fn(() => map.clear()),
    get size() {
      return map.size;
    },
  };
}

describe('npmApi unit tests', () => {
  const BASE_TIME = 1700000000000;
  let dateSpy;

  beforeEach(() => {
    clearNpmCache();
    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME);
  });

  afterEach(() => {
    dateSpy.mockRestore();
    clearNpmCache();
  });

  describe('inferNpmPackageName', () => {
    it('1. correctly maps well-known repository identifiers to npm package names', () => {
      expect(inferNpmPackageName('facebook/react')).toBe('react');
      expect(inferNpmPackageName('vuejs/core')).toBe('vue');
      expect(inferNpmPackageName('vercel/next.js')).toBe('next');
      expect(inferNpmPackageName('tailwindlabs/tailwindcss')).toBe('tailwindcss');
    });

    it('2. infers repository slug for unmapped repositories and returns null for invalid inputs', () => {
      expect(inferNpmPackageName('my-org/custom-lib')).toBe('custom-lib');
      expect(inferNpmPackageName('')).toBeNull();
      expect(inferNpmPackageName(null)).toBeNull();
      expect(inferNpmPackageName(undefined)).toBeNull();
      expect(inferNpmPackageName(12345)).toBeNull();
    });
  });

  describe('formatNpmDownloads', () => {
    it('3. formats large and small numbers accurately and handles invalid input', () => {
      expect(formatNpmDownloads(2_500_000_000)).toBe('2.5B');
      expect(formatNpmDownloads(18_400_000)).toBe('18.4M');
      expect(formatNpmDownloads(65_200)).toBe('65.2k');
      expect(formatNpmDownloads(450)).toBe('450');
      expect(formatNpmDownloads(-10)).toBe('-');
      expect(formatNpmDownloads(NaN)).toBe('-');
      expect(formatNpmDownloads(null)).toBe('-');
    });
  });

  describe('fetchNpmWeeklyDownloads with mocked fetch', () => {
    it('4. returns download count on successful API response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ downloads: 42500000 }),
      });

      const downloads = await fetchNpmWeeklyDownloads('facebook/react', {
        fetchImpl: mockFetch,
        storage: null,
      });

      expect(downloads).toBe(42500000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://api.npmjs.org/downloads/point/last-week/react');
    });

    it('5. returns null on 404 / non-ok response and caches the null result', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'package not found' }),
      });

      const downloads = await fetchNpmWeeklyDownloads('nonexistent/package-xyz', {
        fetchImpl: mockFetch,
        storage: null,
      });

      expect(downloads).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Subsequent call should hit cache and not re-fetch
      const secondCall = await fetchNpmWeeklyDownloads('nonexistent/package-xyz', {
        fetchImpl: mockFetch,
        storage: null,
      });
      expect(secondCall).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('6. gracefully catches network exceptions and returns null without throwing', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error (offline)'));

      const result = await fetchNpmWeeklyDownloads('facebook/react', {
        fetchImpl: mockFetch,
        storage: null,
      });

      expect(result).toBeNull();
    });

    it('7. deduplicates simultaneous in-flight requests for the same package', async () => {
      let resolvePromise;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockFetch = vi.fn().mockReturnValue(
        delayedPromise.then(() => ({
          ok: true,
          status: 200,
          json: async () => ({ downloads: 15000 }),
        }))
      );

      const req1 = fetchNpmWeeklyDownloads('vitejs/vite', { fetchImpl: mockFetch, storage: null });
      const req2 = fetchNpmWeeklyDownloads('vitejs/vite', { fetchImpl: mockFetch, storage: null });

      resolvePromise();
      const [res1, res2] = await Promise.all([req1, req2]);

      expect(res1).toBe(15000);
      expect(res2).toBe(15000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache behavior', () => {
    it('8. hits in-memory cache on subsequent requests within 1-hour TTL without network calls', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ downloads: 99000 }),
      });

      const first = await fetchNpmWeeklyDownloads('colinhacks/zod', { fetchImpl: mockFetch, storage: null });
      const second = await fetchNpmWeeklyDownloads('colinhacks/zod', { fetchImpl: mockFetch, storage: null });

      expect(first).toBe(99000);
      expect(second).toBe(99000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('9. evicts expired in-memory cache entry when TTL (1 hour) is exceeded', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ downloads: 50000 }),
      });

      // Fetch at T=0
      await fetchNpmWeeklyDownloads('sveltejs/svelte', { fetchImpl: mockFetch, storage: null });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Fast forward 61 minutes (exceeds 60 min TTL)
      dateSpy.mockReturnValue(BASE_TIME + 61 * 60 * 1000);

      await fetchNpmWeeklyDownloads('sveltejs/svelte', { fetchImpl: mockFetch, storage: null });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('10. enforces MEMORY_CACHE_LIMIT (50) by evicting oldest LRU items', async () => {
      const mockFetch = vi.fn(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ downloads: 100 }),
        });
      });

      // Add 55 packages sequentially
      for (let i = 1; i <= 55; i++) {
        await fetchNpmWeeklyDownloads(`org/package-${i}`, { fetchImpl: mockFetch, storage: null });
      }

      expect(npmMemoryCache.size).toBeLessThanOrEqual(MEMORY_CACHE_LIMIT);
      expect(npmMemoryCache.size).toBe(50);

      // First items (1 through 5) should have been evicted
      expect(npmMemoryCache.has('octoclash_npm_cache_package-1')).toBe(false);
      expect(npmMemoryCache.has('octoclash_npm_cache_package-55')).toBe(true);
    });

    it('11. restores valid cached downloads from persistent storage and populates in-memory cache', async () => {
      const storage = createMockStorage();
      const mockFetch = vi.fn();

      storage.getItem.mockReturnValue(
        JSON.stringify({ downloads: 777000, timestamp: BASE_TIME - 1000 })
      );

      const downloads = await fetchNpmWeeklyDownloads('withastro/astro', {
        fetchImpl: mockFetch,
        storage,
      });

      expect(downloads).toBe(777000);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(npmMemoryCache.has('octoclash_npm_cache_astro')).toBe(true);
    });

    it('12. evicts expired entries from persistent storage', async () => {
      const storage = createMockStorage();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ downloads: 888000 }),
      });

      // Entry timestamp is 2 hours old
      storage.getItem.mockReturnValue(
        JSON.stringify({ downloads: 111000, timestamp: BASE_TIME - 2 * 60 * 60 * 1000 })
      );

      const downloads = await fetchNpmWeeklyDownloads('oven-sh/bun', {
        fetchImpl: mockFetch,
        storage,
      });

      expect(downloads).toBe(888000);
      expect(storage.removeItem).toHaveBeenCalledWith('octoclash_npm_cache_bun');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('13. gracefully ignores corrupted JSON in storage without failing', async () => {
      const storage = createMockStorage();
      storage.getItem.mockReturnValue('corrupted-json-{{{');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ downloads: 44000 }),
      });

      const downloads = await fetchNpmWeeklyDownloads('expressjs/express', {
        fetchImpl: mockFetch,
        storage,
      });

      expect(downloads).toBe(44000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
