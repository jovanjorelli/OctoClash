/**
 * NPM API integration service.
 * Fetches weekly download counts for GitHub repositories with package name heuristic and dual-layer caching.
 */

const NPM_API_BASE = 'https://api.npmjs.org/downloads/point/last-week';
const NPM_CACHE_PREFIX = 'octoclash_npm_cache_';
const NPM_CACHE_TTL_MS = 1000 * 60 * 60;

export const MEMORY_CACHE_LIMIT = 50;

export const npmMemoryCache = new Map();
const inFlightRequests = new Map();

function touchNpmMemoryCache(key, entry) {
  if (npmMemoryCache.has(key)) {
    npmMemoryCache.delete(key);
  }
  npmMemoryCache.set(key, entry);

  while (npmMemoryCache.size > MEMORY_CACHE_LIMIT) {
    const oldestKey = npmMemoryCache.keys().next().value;
    npmMemoryCache.delete(oldestKey);
  }
}

const WELL_KNOWN_PACKAGES = {
  'facebook/react': 'react',
  'vuejs/core': 'vue',
  'vuejs/vue': 'vue',
  'vercel/next.js': 'next',
  'nuxt/nuxt': 'nuxt',
  'vitejs/vite': 'vite',
  'webpack/webpack': 'webpack',
  'tailwindlabs/tailwindcss': 'tailwindcss',
  'unocss/unocss': 'unocss',
  'prisma/prisma': 'prisma',
  'drizzle-team/drizzle-orm': 'drizzle-orm',
  'colinhacks/zod': 'zod',
  'fabian-hiller/valibot': 'valibot',
  'oven-sh/bun': 'bun',
  'denoland/deno': 'deno',
  'angular/angular': '@angular/core',
  'sveltejs/svelte': 'svelte',
  'solidjs/solid': 'solid-js',
  'reduxjs/redux': 'redux',
  'mobxjs/mobx': 'mobx',
  'expressjs/express': 'express',
  'fastify/fastify': 'fastify',
  'nestjs/nest': '@nestjs/core',
  'remix-run/remix': '@remix-run/react',
  'withastro/astro': 'astro',
  'vitest-dev/vitest': 'vitest',
  'jestjs/jest': 'jest',
  'eslint/eslint': 'eslint',
  'prettier/prettier': 'prettier',
};

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

/**
 * Formats a raw download number into human-readable compact text (e.g. 1.2M, 45.0k).
 * @param {number} count - Raw download count.
 * @returns {string} Formatted string or '-' if invalid.
 */
export function formatNpmDownloads(count) {
  if (typeof count !== 'number' || Number.isNaN(count) || count < 0) return '-';
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`;
  }
  return count.toLocaleString();
}

/**
 * Heuristically determines npm package name from well-known mappings or repo slug name.
 * @param {string} ownerRepo - 'owner/repo' identifier.
 * @returns {string|null} Inferred npm package name, or null if invalid.
 */
export function inferNpmPackageName(ownerRepo) {
  if (!ownerRepo || typeof ownerRepo !== 'string') return null;
  const normalized = ownerRepo.trim().toLowerCase();
  if (WELL_KNOWN_PACKAGES[normalized]) {
    return WELL_KNOWN_PACKAGES[normalized];
  }
  const parts = normalized.split('/');
  if (parts.length === 2) {
    return parts[1];
  }
  return normalized;
}

/**
 * Fetches weekly download statistics for a repository's inferred npm package.
 * Utilizes in-memory and optional local storage caching with 1-hour TTL.
 * @param {string} ownerRepo - 'owner/repo' identifier.
 * @param {object} [options={}] - Custom fetch and storage dependencies.
 * @returns {Promise<number|null>} Total downloads in past week, or null if not found.
 */
export async function fetchNpmWeeklyDownloads(ownerRepo, { fetchImpl = fetch, storage = getStorage() } = {}) {
  const packageName = inferNpmPackageName(ownerRepo);
  if (!packageName) return null;

  const cacheKey = `${NPM_CACHE_PREFIX}${packageName}`;
  const now = Date.now();

  if (npmMemoryCache.has(cacheKey)) {
    const entry = npmMemoryCache.get(cacheKey);
    if (entry && now - entry.timestamp < NPM_CACHE_TTL_MS) {
      touchNpmMemoryCache(cacheKey, entry);
      return entry.downloads;
    }
    npmMemoryCache.delete(cacheKey);
  }

  if (storage) {
    try {
      const raw = storage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.timestamp === 'number' && now - parsed.timestamp < NPM_CACHE_TTL_MS) {
          touchNpmMemoryCache(cacheKey, parsed);
          return parsed.downloads;
        }
        storage.removeItem(cacheKey);
      }
    } catch {
      // Storage access errors are ignored to avoid disrupting UI
      void 0;
    }
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const res = await fetchImpl(`${NPM_API_BASE}/${encodeURIComponent(packageName)}`);
      if (!res.ok) {
        const entry = { downloads: null, timestamp: Date.now() };
        touchNpmMemoryCache(cacheKey, entry);
        return null;
      }
      const data = await res.json();
      const count = typeof data?.downloads === 'number' ? data.downloads : null;
      const entry = { downloads: count, timestamp: Date.now() };

      touchNpmMemoryCache(cacheKey, entry);
      if (storage) {
        try {
          storage.setItem(cacheKey, JSON.stringify(entry));
        } catch {
          void 0;
        }
      }

      return count;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Clears in-memory npm download cache and pending in-flight request tracking.
 */
export function clearNpmCache() {
  npmMemoryCache.clear();
  inFlightRequests.clear();
}
