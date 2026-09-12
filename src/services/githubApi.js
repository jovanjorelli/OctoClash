const API_BASE_URL = 'https://api.github.com';
const CACHE_PREFIX = 'octoclash_cache_v3_';
const CACHE_TTL_MS = 1000 * 60 * 60;
const MEMORY_CACHE_LIMIT = 50;
const DEFAULT_MAX_RETRIES = 3;

const sharedMemoryCache = new Map();

const defaultSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function getFetch() {
  if (typeof fetch === 'undefined') {
    throw new Error('fetchUnavailable');
  }
  return fetch;
}

function hashToken(token) {
  let hash = 5381;
  for (let i = 0; i < token.length; i += 1) {
    hash = ((hash << 5) + hash) ^ token.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function normalizeForCache(value) {
  return String(value).trim().toLowerCase();
}

export function normalizeRepoFullName(value) {
  const raw = String(value || '').trim();
  const withoutGithubUrl = raw
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^git@github\.com:/i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');

  const parts = withoutGithubUrl.split('/');
  if (parts.length !== 2) {
    throw new Error('invalidRepo');
  }

  const [owner, repo] = parts;
  const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
  const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;
  if (!ownerPattern.test(owner) || !repoPattern.test(repo) || repo === '.' || repo === '..') {
    throw new Error('invalidRepo');
  }

  return `${owner}/${repo}`;
}

function repoApiPath(ownerRepo, suffix = '') {
  const normalized = normalizeRepoFullName(ownerRepo);
  const [owner, repo] = normalized.split('/');
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${suffix}`;
}

function normalizeCacheItem(item, now) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.timestamp !== 'number' || now - item.timestamp > CACHE_TTL_MS) {
    return null;
  }
  return item;
}

function touchMemoryCache(memoryCache, fullKey, item) {
  if (memoryCache.has(fullKey)) {
    memoryCache.delete(fullKey);
  }
  memoryCache.set(fullKey, item);

  while (memoryCache.size > MEMORY_CACHE_LIMIT) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
}

function getCache(key, { storage, memoryCache, now }) {
  const fullKey = `${CACHE_PREFIX}${key}`;

  if (memoryCache.has(fullKey)) {
    const item = normalizeCacheItem(memoryCache.get(fullKey), now);
    if (item) {
      touchMemoryCache(memoryCache, fullKey, item);
      return item.data;
    }
    memoryCache.delete(fullKey);
  }

  if (!storage) return null;

  try {
    const raw = storage.getItem(fullKey);
    if (!raw) return null;

    const item = normalizeCacheItem(JSON.parse(raw), now);
    if (!item) {
      storage.removeItem(fullKey);
      return null;
    }

    touchMemoryCache(memoryCache, fullKey, item);
    return item.data;
  } catch {
    return null;
  }
}

function setCache(key, data, { storage, memoryCache, now }) {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const item = { data, timestamp: now };

  touchMemoryCache(memoryCache, fullKey, item);

  if (!storage) return;

  try {
    storage.setItem(fullKey, JSON.stringify(item));
  } catch (error) {
    if (error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('localStorage quota exceeded. Relying on in-memory cache.');
    } else {
      console.warn('localStorage is unavailable. Relying on in-memory cache.', error);
    }
  }
}

function safeDateMs(value) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

const PERMISSIVE_SPDX = new Set([
  'mit', 'apache-2.0', 'bsd-2-clause', 'bsd-3-clause', 'isc', '0bsd',
  'unlicense', 'cc0-1.0', 'wtfpl', 'zlib', 'artistic-2.0', 'upl-1.0'
]);

const COPYLEFT_SPDX = new Set([
  'gpl-2.0', 'gpl-3.0', 'agpl-3.0', 'lgpl-2.1', 'lgpl-3.0',
  'mpl-2.0', 'epl-2.0', 'sspl-1.0', 'osl-3.0', 'eupl-1.2'
]);

export function classifyLicense(license) {
  if (!license || typeof license !== 'object') {
    return { type: 'unlicensed', label: 'None', risk: 'high' };
  }
  const spdx = String(license.spdx_id || license.key || license.name || '').trim();
  const lower = spdx.toLowerCase();

  if (!spdx || lower === 'noassertion' || lower === 'none') {
    return { type: 'unlicensed', label: 'None', risk: 'high' };
  }

  if (PERMISSIVE_SPDX.has(lower)) {
    return { type: 'permissive', label: spdx, risk: 'low' };
  }

  if (COPYLEFT_SPDX.has(lower) || lower.includes('gpl') || lower.includes('mpl') || lower.includes('epl')) {
    return { type: 'copyleft', label: spdx, risk: 'medium' };
  }

  return { type: 'other', label: spdx, risk: 'unknown' };
}

export function calculateHealthScore({ repoInfo, commitsLastYear, commitActivity, avgIssueTime, contributors, now = Date.now() }) {
  if (!repoInfo) return { score: 0, grade: 'F' };

  let score = 0;

  const pushTime = safeDateMs(repoInfo.pushed_at || repoInfo.updated_at);
  if (pushTime !== null) {
    const daysSincePush = Math.max(0, (now - pushTime) / (1000 * 60 * 60 * 24));
    if (daysSincePush <= 7) score += 30;
    else if (daysSincePush <= 30) score += 24;
    else if (daysSincePush <= 90) score += 16;
    else if (daysSincePush <= 180) score += 8;
  }

  const yearlyCommits = Number(commitsLastYear) || 0;
  score += Math.min(15, Math.round((yearlyCommits / 300) * 15));

  const activity = Array.isArray(commitActivity) ? commitActivity : [];
  const recentWeeks = activity.slice(-4);
  const recentCommits = recentWeeks.reduce((acc, w) => acc + (Number(w?.total) || 0), 0);
  if (recentCommits > 0) {
    score += 10;
  } else if (activity.slice(-8).reduce((acc, w) => acc + (Number(w?.total) || 0), 0) > 0) {
    score += 5;
  }

  if (avgIssueTime) {
    const match = String(avgIssueTime).match(/(\d+)/);
    const days = match ? parseInt(match[1], 10) : (avgIssueTime.includes('<') ? 0.5 : 30);
    if (days <= 3) score += 25;
    else if (days <= 14) score += 20;
    else if (days <= 30) score += 15;
    else if (days <= 90) score += 10;
    else score += 5;
  } else if (repoInfo.has_issues === false) {
    score += 15;
  } else {
    score += 5;
  }

  if (repoInfo.license?.spdx_id && repoInfo.license.spdx_id !== 'NOASSERTION') {
    score += 5;
  }

  const contCount = Array.isArray(contributors) ? contributors.length : 0;
  score += Math.min(10, contCount * 2);

  if (!repoInfo.archived && !repoInfo.disabled) {
    score += 5;
  } else {
    score = Math.min(score, 35);
  }

  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  let grade = 'F';
  if (clampedScore >= 90) grade = 'A+';
  else if (clampedScore >= 80) grade = 'A';
  else if (clampedScore >= 70) grade = 'B';
  else if (clampedScore >= 55) grade = 'C';
  else if (clampedScore >= 40) grade = 'D';

  return { score: clampedScore, grade };
}

export function normalizeRepoData({
  repoInfo,
  languages,
  commitActivityRaw,
  contributors,
  issues,
  releaseRaw,
  now = Date.now(),
}) {
  const commitActivity = Array.isArray(commitActivityRaw) ? commitActivityRaw : [];
  const commitsLastYear = commitActivity.reduce((acc, week) => acc + (Number(week?.total) || 0), 0);

  let avgIssueTime = null;
  if (Array.isArray(issues) && issues.length > 0) {
    const issueDurations = issues
      .filter(issue => !issue.pull_request && issue.closed_at)
      .map(issue => {
        const created = safeDateMs(issue.created_at);
        const closed = safeDateMs(issue.closed_at);
        if (created === null || closed === null || closed < created) return null;
        return closed - created;
      })
      .filter(duration => duration !== null);

    if (issueDurations.length > 0) {
      const avgMs = issueDurations.reduce((acc, duration) => acc + duration, 0) / issueDurations.length;
      const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
      avgIssueTime = avgDays === 0 ? '< 1 day' : `${avgDays} days`;
    }
  }

  let latestRelease = null;
  if (releaseRaw && typeof releaseRaw === 'object') {
    if (releaseRaw.tag_name) {
      const pubMs = safeDateMs(releaseRaw.published_at);
      const daysAgo = pubMs !== null ? Math.max(0, Math.round((now - pubMs) / (1000 * 60 * 60 * 24))) : null;
      latestRelease = {
        tag: releaseRaw.tag_name,
        name: releaseRaw.name || releaseRaw.tag_name,
        publishedAt: releaseRaw.published_at || null,
        daysAgo,
        url: releaseRaw.html_url || `${repoInfo?.html_url}/releases/tag/${releaseRaw.tag_name}`,
      };
    } else if (Array.isArray(releaseRaw) && releaseRaw.length > 0 && releaseRaw[0]?.name) {
      latestRelease = {
        tag: releaseRaw[0].name,
        name: releaseRaw[0].name,
        publishedAt: null,
        daysAgo: null,
        url: `${repoInfo?.html_url}/releases/tag/${releaseRaw[0].name}`,
      };
    }
  }

  const health = calculateHealthScore({
    repoInfo,
    commitsLastYear,
    commitActivity,
    avgIssueTime,
    contributors,
    now,
  });

  const licenseClassification = classifyLicense(repoInfo?.license);

  return {
    info: repoInfo,
    languages: languages && typeof languages === 'object' ? languages : {},
    commitActivity,
    commitsLastYear,
    contributors: Array.isArray(contributors) ? contributors : [],
    avgIssueTime,
    latestRelease,
    healthScore: health.score,
    healthGrade: health.grade,
    licenseClassification,
  };
}

export function createGitHubApiClient({
  token = '',
  fetchImpl = getFetch(),
  storage = getBrowserStorage(),
  memoryCache = sharedMemoryCache,
  now = Date.now,
  sleep = defaultSleep,
  maxRetries = DEFAULT_MAX_RETRIES,
  onRateLimit = null,
} = {}) {
  const authToken = token.trim();
  const cacheScope = authToken ? `auth_${hashToken(authToken)}` : 'anon';
  const persistentStorage = authToken ? null : storage;

  const cacheOptions = () => ({
    storage: persistentStorage,
    memoryCache,
    now: now(),
  });

  const fetchWithToken = async (url, customAccept = null, retryCount = 0) => {
    const headers = {
      Accept: customAccept || 'application/vnd.github.v3+json',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetchImpl(`${API_BASE_URL}${url}`, { headers });
    const remaining = response.headers?.get?.('X-RateLimit-Remaining');
    const limit = response.headers?.get?.('X-RateLimit-Limit');
    const reset = response.headers?.get?.('X-RateLimit-Reset');

    if (remaining !== null && remaining !== undefined && onRateLimit) {
      const parsedRemaining = parseInt(remaining, 10);
      const parsedLimit = parseInt(limit, 10) || 60;
      const parsedReset = parseInt(reset, 10) || null;
      if (!Number.isNaN(parsedRemaining)) {
        onRateLimit({ remaining: parsedRemaining, limit: parsedLimit, reset: parsedReset });
      }
    }

    if (response.status === 429 || (response.status === 403 && remaining === '0')) {
      throw new Error('rateLimit');
    }
    if (response.status === 403) {
      throw new Error('forbidden');
    }
    if (response.status === 404) {
      throw new Error('notFound');
    }
    if (response.status === 202) {
      if (retryCount >= maxRetries) throw new Error('retryLater');
      await sleep(1000 * (retryCount + 1));
      return fetchWithToken(url, customAccept, retryCount + 1);
    }
    if (!response.ok) {
      throw new Error(`http${response.status}`);
    }

    return response.json();
  };

  const inFlightRequests = new Map();

  const cached = async (key, loader) => {
    const fullKey = `${cacheScope}_${key}`;
    const cachedData = getCache(fullKey, cacheOptions());
    if (cachedData) return cachedData;

    if (inFlightRequests.has(fullKey)) {
      return inFlightRequests.get(fullKey);
    }

    const promise = (async () => {
      try {
        const data = await loader();
        setCache(fullKey, data, cacheOptions());
        return data;
      } finally {
        inFlightRequests.delete(fullKey);
      }
    })();

    inFlightRequests.set(fullKey, promise);
    return promise;
  };

  const fetchRepoData = async (ownerRepo) => {
    const normalizedRepo = normalizeRepoFullName(ownerRepo);
    const cacheKey = `repo_${normalizeForCache(normalizedRepo)}`;

    return cached(cacheKey, async () => {
      const basePath = repoApiPath(normalizedRepo);
      const [repoInfo, languages, commitActivityRaw, contributors, issues, releaseRaw] = await Promise.all([
        fetchWithToken(basePath),
        fetchWithToken(`${basePath}/languages`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return {};
        }),
        fetchWithToken(`${basePath}/stats/commit_activity`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return [];
        }),
        fetchWithToken(`${basePath}/contributors?per_page=5`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return [];
        }),
        fetchWithToken(`${basePath}/issues?state=closed&per_page=10`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return [];
        }),
        fetchWithToken(`${basePath}/releases/latest`).catch(async error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return fetchWithToken(`${basePath}/tags?per_page=1`).catch(() => null);
        }),
      ]);

      return normalizeRepoData({
        repoInfo,
        languages,
        commitActivityRaw,
        contributors,
        issues,
        releaseRaw,
        now: now(),
      });
    });
  };

  const searchRepos = async (query) => {
    const normalizedQuery = String(query || '').trim();
    if (normalizedQuery.length < 3) return [];

    const cacheKey = `search_${normalizeForCache(normalizedQuery)}`;
    return cached(cacheKey, async () => {
      const data = await fetchWithToken(`/search/repositories?q=${encodeURIComponent(normalizedQuery)}&per_page=5`);
      return Array.isArray(data?.items) ? data.items : [];
    });
  };

  const fetchStarHistory = async (ownerRepo, totalStars, createdAt = null) => {
    const normalizedRepo = normalizeRepoFullName(ownerRepo);
    const safeTotalStars = Math.max(0, Number(totalStars) || 0);
    if (safeTotalStars === 0) return [{ date: createdAt || null, stars: 0 }];

    const cacheKey = `stars_${normalizeForCache(normalizedRepo)}_${safeTotalStars}_${createdAt || ''}`;
    return cached(cacheKey, async () => {
      const maxSamples = 5;
      const totalPages = Math.ceil(safeTotalStars / 100);
      const pagesToFetch = [];

      for (let i = 1; i <= maxSamples; i += 1) {
        let page = Math.min(390, Math.max(1, Math.floor((totalPages / maxSamples) * i)));
        if (i === 1) page = 1;
        if (!pagesToFetch.includes(page)) pagesToFetch.push(page);
      }

      const basePath = repoApiPath(normalizedRepo);
      const responses = await Promise.all(
        pagesToFetch.map(page => (
          fetchWithToken(`${basePath}/stargazers?page=${page}&per_page=100`, 'application/vnd.github.v3.star+json')
            .catch(error => {
              if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
              return [];
            })
        ))
      );

      const historyPoints = [];
      if (createdAt) {
        historyPoints.push({
          date: createdAt,
          stars: 0,
        });
      }

      responses.forEach((pageData, index) => {
        if (!Array.isArray(pageData) || pageData.length === 0) return;
        const lastStargazer = pageData[pageData.length - 1];
        const starsSoFar = Math.min(safeTotalStars, (pagesToFetch[index] - 1) * 100 + pageData.length);
        if (lastStargazer?.starred_at) {
          historyPoints.push({
            date: lastStargazer.starred_at,
            stars: starsSoFar,
          });
        }
      });

      if (createdAt && (historyPoints.length <= 2 || safeTotalStars > 40000)) {
        const now = Date.now();
        const createdTime = new Date(createdAt).getTime();
        if (now > createdTime) {
          const intervals = 5;
          for (let i = 1; i <= intervals; i += 1) {
            const fraction = i / intervals;
            const time = createdTime + (now - createdTime) * fraction;
            const starRatio = Math.pow(fraction, 1.6);
            const stars = i === intervals ? safeTotalStars : Math.min(safeTotalStars, Math.round(safeTotalStars * starRatio));
            historyPoints.push({
              date: new Date(time).toISOString(),
              stars,
            });
          }
        }
      }

      historyPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

      const dedupedPoints = [];
      const seenDates = new Set();
      for (const pt of historyPoints) {
        if (!pt.date) continue;
        const d = pt.date.split('T')[0];
        if (!seenDates.has(d)) {
          seenDates.add(d);
          dedupedPoints.push(pt);
        }
      }

      return dedupedPoints.length > 0 ? dedupedPoints : [{ date: createdAt || null, stars: 0 }];
    });
  };

  const fetchReadmeHtml = async (ownerRepo) => {
    const normalizedRepo = normalizeRepoFullName(ownerRepo);
    const cacheKey = `readme_${normalizeForCache(normalizedRepo)}`;
    return cached(cacheKey, async () => {
      const readmePath = repoApiPath(normalizedRepo, '/readme');
      const response = await fetchImpl(`${API_BASE_URL}${readmePath}`, {
        headers: {
          Accept: 'application/vnd.github.html',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      const remaining = response.headers?.get?.('X-RateLimit-Remaining');
      if (response.status === 429 || (response.status === 403 && remaining === '0')) {
        throw new Error('rateLimit');
      }
      if (!response.ok) throw new Error('readmeFailed');
      return response.text();
    });
  };

  return {
    fetchRepoData,
    searchRepos,
    fetchStarHistory,
    fetchReadmeHtml,
  };
}

export function clearSharedGitHubApiCache() {
  sharedMemoryCache.clear();
}
