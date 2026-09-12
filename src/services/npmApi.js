const NPM_API_BASE = 'https://api.npmjs.org/downloads/point/last-week';
const NPM_CACHE_PREFIX = 'octoclash_npm_cache_';
const NPM_CACHE_TTL_MS = 1000 * 60 * 60;

const npmMemoryCache = new Map();

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

export async function fetchNpmWeeklyDownloads(ownerRepo, { fetchImpl = fetch, storage = getStorage() } = {}) {
  const packageName = inferNpmPackageName(ownerRepo);
  if (!packageName) return null;

  const cacheKey = `${NPM_CACHE_PREFIX}${packageName}`;
  const now = Date.now();

  if (npmMemoryCache.has(cacheKey)) {
    const entry = npmMemoryCache.get(cacheKey);
    if (entry && now - entry.timestamp < NPM_CACHE_TTL_MS) {
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
          npmMemoryCache.set(cacheKey, parsed);
          return parsed.downloads;
        }
        storage.removeItem(cacheKey);
      }
    } catch {
      void 0;
    }
  }

  try {
    const res = await fetchImpl(`${NPM_API_BASE}/${encodeURIComponent(packageName)}`);
    if (!res.ok) {
      const entry = { downloads: null, timestamp: now };
      npmMemoryCache.set(cacheKey, entry);
      return null;
    }
    const data = await res.json();
    const count = typeof data?.downloads === 'number' ? data.downloads : null;
    const entry = { downloads: count, timestamp: now };

    npmMemoryCache.set(cacheKey, entry);
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
  }
}

export function clearNpmCache() {
  npmMemoryCache.clear();
}
