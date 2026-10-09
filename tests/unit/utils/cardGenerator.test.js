import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../setup.js';
import { generateBattleCardBlob, exportBattleCardPng } from '../../../src/utils/cardGenerator.js';

describe('cardGenerator utility tests', () => {
  let mockCtx;
  let originalGetContext;
  let originalToBlob;
  let originalImage;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let clickSpy;

  const sampleRepo = (name = 'react', overrides = {}) => ({
    info: {
      name,
      full_name: `facebook/${name}`,
      language: 'JavaScript',
      stargazers_count: 220000,
      forks_count: 45000,
      open_issues_count: 850,
      license: { spdx_id: 'MIT' },
      owner: { avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4' },
      ...overrides.info,
    },
    healthScore: 92,
    healthGrade: 'A',
    commitsLastYear: 1420,
    ...overrides,
  });

  beforeEach(() => {
    mockCtx = {
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      measureText: vi.fn((text) => ({ width: (text ? text.length : 0) * 8 })),
    };

    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(function (type) {
      if (type === '2d') return mockCtx;
      return null;
    });

    originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback, type) {
      callback(new Blob(['mock-png-data'], { type: type || 'image/png' }));
    });

    originalImage = globalThis.Image;
    globalThis.Image = class MockImage {
      constructor() {
        this.crossOrigin = '';
        this._src = '';
        this.onload = null;
        this.onerror = null;
      }
      get src() {
        return this._src;
      }
      set src(val) {
        this._src = val;
        if (!val || val.includes('fail-img')) {
          setTimeout(() => this.onerror && this.onerror(new Error('fail')), 0);
        } else {
          setTimeout(() => this.onload && this.onload(), 0);
        }
      }
    };

    originalCreateObjectURL = globalThis.URL.createObjectURL;
    originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-card-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    globalThis.Image = originalImage;
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('generateBattleCardBlob', () => {
    it('returns null if reposData is empty or falsy', async () => {
      expect(await generateBattleCardBlob(null)).toBeNull();
      expect(await generateBattleCardBlob([])).toBeNull();
    });

    it('returns null if canvas 2D context fails to initialize', async () => {
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
      const res = await generateBattleCardBlob([sampleRepo()]);
      expect(res).toBeNull();
    });

    it('generates a card for a single repository (1 repo layout)', async () => {
      const blob = await generateBattleCardBlob([sampleRepo()], { 'facebook/react': 25000000 });
      expect(blob).toBeInstanceOf(Blob);
      expect(mockCtx.fillText).toHaveBeenCalledWith('OctoClash', 48, 48);
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    it('generates a card for multiple repositories in 1 row (3 repos layout)', async () => {
      const repos = [
        sampleRepo('react', { info: { language: 'JavaScript' }, healthScore: 85, healthGrade: 'A' }),
        sampleRepo('vue', { info: { language: 'TypeScript' }, healthScore: 65, healthGrade: 'C' }),
        sampleRepo('angular', { info: { language: 'Python' }, healthScore: 40, healthGrade: 'F' }),
      ];

      const blob = await generateBattleCardBlob(repos, {}, 'dark');
      expect(blob).toBeInstanceOf(Blob);
      expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
    });

    it('generates a card for compact 2-row layout with 8 repositories', async () => {
      const repos = Array.from({ length: 8 }, (_, i) =>
        sampleRepo(`repo-${i}`, {
          info: {
            full_name: `owner/really-long-repository-name-that-needs-truncation-${i}`,
            language: i % 2 === 0 ? 'Ruby' : undefined,
            license: i % 2 === 0 ? null : { spdx_id: 'Apache-2.0' },
            owner: { avatar_url: i === 0 ? 'https://example.com/fail-img.png' : 'https://example.com/avatar.png' },
          },
          healthScore: 75,
          healthGrade: 'B',
        })
      );

      const blob = await generateBattleCardBlob(repos, {}, 'light', 0, 1);
      expect(blob).toBeInstanceOf(Blob);
      expect(mockCtx.strokeRect).toHaveBeenCalled();
    });

    it('respects automatic dark/light theme based on document element class', async () => {
      document.documentElement.classList.add('dark');
      const darkBlob = await generateBattleCardBlob([sampleRepo()], {}, 'auto');
      expect(darkBlob).toBeInstanceOf(Blob);

      document.documentElement.classList.remove('dark');
      const lightBlob = await generateBattleCardBlob([sampleRepo()], {}, 'auto');
      expect(lightBlob).toBeInstanceOf(Blob);
    });

    it('renders subtitle with part and total pages when totalPages > 1', async () => {
      const blob = await generateBattleCardBlob([sampleRepo()], {}, 'dark', 1, 3);
      expect(blob).toBeInstanceOf(Blob);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'HEAD-TO-HEAD REPOSITORY CLASH • PART 2 OF 3',
        48,
        72
      );
    });
  });

  describe('exportBattleCardPng', () => {
    it('returns early when reposData is empty or falsy', async () => {
      await exportBattleCardPng([]);
      await exportBattleCardPng(null);
      expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('exports a single battle card and triggers link click', async () => {
      const onProgress = vi.fn();
      await exportBattleCardPng([sampleRepo()], {}, 'dark', onProgress);

      expect(onProgress).toHaveBeenCalledWith({ current: 1, total: 1 });
      expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('exports multi-page battle cards in 10-item chunks and tracks progress', async () => {
      const repos = Array.from({ length: 12 }, (_, i) => sampleRepo(`repo-${i}`));
      const onProgress = vi.fn();

      await exportBattleCardPng(repos, {}, 'light', onProgress);

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, { current: 1, total: 2 });
      expect(onProgress).toHaveBeenNthCalledWith(2, { current: 2, total: 2 });
      expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(2);
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });

    it('handles themePreference fallback to document class and blob failure gracefully', async () => {
      document.documentElement.classList.add('dark');
      // Force generateBattleCardBlob to return null
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

      await exportBattleCardPng([sampleRepo()], {}, 'auto');
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });
});
