import React, { useEffect } from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useGitHubApi } from './useGitHubApi';
import { useAppStore } from '../store/appStore';
import { clearSharedGitHubApiCache } from '../services/githubApi';

function response(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => headers[name] ?? null,
    },
    json: async () => body,
    text: async () => String(body),
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createWebStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  };
}

function installStorage(name) {
  if (!window[name]) {
    const storage = createWebStorage();
    Object.defineProperty(window, name, {
      value: storage,
      configurable: true,
    });
    vi.stubGlobal(name, storage);
  }
  window[name].clear();
}

function Probe({ onApi }) {
  const api = useGitHubApi();

  useEffect(() => {
    onApi(api);
  }, [api, onApi]);

  return (
    <>
      <div data-testid="loading">{String(api.loading)}</div>
      <div data-testid="error">{api.error || ''}</div>
    </>
  );
}

describe('useGitHubApi', () => {
  beforeEach(() => {
    clearSharedGitHubApiCache();
    installStorage('localStorage');
    installStorage('sessionStorage');
    useAppStore.setState({ token: '', repos: [], reposData: [] });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps loading true until all concurrent tracked requests settle', async () => {
    const slowRepo = deferred();
    const fetchMock = vi.fn(async (url) => {
      if (url === 'https://api.github.com/repos/owner/slow') {
        return slowRepo.promise;
      }
      if (url === 'https://api.github.com/repos/owner/missing') {
        return response({}, { status: 404 });
      }
      if (url.endsWith('/languages')) return response({});
      if (url.endsWith('/stats/commit_activity')) return response([]);
      if (url.includes('/contributors')) return response([]);
      if (url.includes('/issues')) return response([]);
      return response({ full_name: 'owner/slow', name: 'slow' });
    });
    vi.stubGlobal('fetch', fetchMock);

    let api;
    render(<Probe onApi={(nextApi) => { api = nextApi; }} />);

    let slowPromise;
    let missingPromise;
    await act(async () => {
      slowPromise = api.fetchRepoData('owner/slow');
      missingPromise = api.fetchRepoData('owner/missing');
    });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('true'));
    await missingPromise;

    expect(screen.getByTestId('loading').textContent).toBe('true');

    await act(async () => {
      slowRepo.resolve(response({ full_name: 'owner/slow', name: 'slow' }));
      await slowPromise;
    });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('error').textContent).toBe('notFound');
  });

  it('returns null and exposes invalidRepo for invalid repository names', async () => {
    vi.stubGlobal('fetch', vi.fn());

    let api;
    render(<Probe onApi={(nextApi) => { api = nextApi; }} />);

    let result;
    await act(async () => {
      result = await api.fetchRepoData('owner/repo/issues');
    });

    expect(result).toBeNull();
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('invalidRepo');
    expect(fetch).not.toHaveBeenCalled();
  });
});
