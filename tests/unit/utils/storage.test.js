import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../setup.js';
import { clearOctoClashStorage, clearOctoClashSession } from '../../../src/utils/storage.js';

describe('storage utility tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  describe('clearOctoClashStorage', () => {
    it('removes keys starting with octoclash_ or matching octoclash-storage from localStorage', () => {
      window.localStorage.setItem('octoclash-storage', 'state-payload');
      window.localStorage.setItem('octoclash_cache_react', 'cache-payload');
      window.localStorage.setItem('octoclash_settings', 'settings-payload');
      window.localStorage.setItem('unrelated_key', 'should-remain');
      window.localStorage.setItem('other_token', 'preserve-me');

      clearOctoClashStorage();

      expect(window.localStorage.getItem('octoclash-storage')).toBeNull();
      expect(window.localStorage.getItem('octoclash_cache_react')).toBeNull();
      expect(window.localStorage.getItem('octoclash_settings')).toBeNull();
      expect(window.localStorage.getItem('unrelated_key')).toBe('should-remain');
      expect(window.localStorage.getItem('other_token')).toBe('preserve-me');
    });

    it('handles empty localStorage without errors', () => {
      expect(() => clearOctoClashStorage()).not.toThrow();
    });

    it('catches and logs errors if storage access throws an exception', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      window.localStorage.setItem('octoclash_test', '123');
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage write protected');
      });

      expect(() => clearOctoClashStorage()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith('Unable to clear app storage.', expect.any(Error));

      removeSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('clearOctoClashSession', () => {
    it('removes octoclash keys from sessionStorage while preserving unrelated session items', () => {
      window.sessionStorage.setItem('octoclash_pat_token', 'ghp_secret');
      window.sessionStorage.setItem('octoclash-storage', 'session-state');
      window.sessionStorage.setItem('analytics_session_id', 'sess-12345');

      clearOctoClashSession();

      expect(window.sessionStorage.getItem('octoclash_pat_token')).toBeNull();
      expect(window.sessionStorage.getItem('octoclash-storage')).toBeNull();
      expect(window.sessionStorage.getItem('analytics_session_id')).toBe('sess-12345');
    });

    it('handles empty sessionStorage gracefully', () => {
      expect(() => clearOctoClashSession()).not.toThrow();
    });
  });
});
