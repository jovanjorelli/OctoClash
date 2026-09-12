import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  inferNpmPackageName,
  formatNpmDownloads,
  fetchNpmWeeklyDownloads,
  clearNpmCache,
} from './npmApi';

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

describe('npmApi service', () => {
  beforeEach(() => {
    clearNpmCache();
  });

  it('infers package names from standard and well-known repos', () => {
    expect(inferNpmPackageName('facebook/react')).toBe('react');
    expect(inferNpmPackageName('vuejs/core')).toBe('vue');
    expect(inferNpmPackageName('vercel/next.js')).toBe('next');
    expect(inferNpmPackageName('tailwindlabs/tailwindcss')).toBe('tailwindcss');
    expect(inferNpmPackageName('some-org/custom-lib')).toBe('custom-lib');
    expect(inferNpmPackageName('')).toBeNull();
  });

  it('formats download counts cleanly', () => {
    expect(formatNpmDownloads(0)).toBe('0');
    expect(formatNpmDownloads(450)).toBe('450');
    expect(formatNpmDownloads(1500)).toBe('1.5k');
    expect(formatNpmDownloads(359733)).toBe('359.7k');
    expect(formatNpmDownloads(92277508)).toBe('92.3M');
    expect(formatNpmDownloads(1200000000)).toBe('1.2B');
    expect(formatNpmDownloads(null)).toBe('-');
    expect(formatNpmDownloads(-5)).toBe('-');
  });

  it('fetches weekly downloads and caches in storage', async () => {
    const storage = createMockStorage();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ downloads: 12500000, package: 'react' }),
    });

    const count = await fetchNpmWeeklyDownloads('facebook/react', { fetchImpl, storage });
    expect(count).toBe(12500000);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const cachedCount = await fetchNpmWeeklyDownloads('facebook/react', { fetchImpl, storage });
    expect(cachedCount).toBe(12500000);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('handles 404 or network errors gracefully', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const count = await fetchNpmWeeklyDownloads('unknown/nonexistent-package-xyz', { fetchImpl });
    expect(count).toBeNull();
  });
});
