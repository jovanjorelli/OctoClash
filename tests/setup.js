import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * Loads environment variables from .env file into process.env.
 * Equivalent to dotenv/config.
 */
export function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[TEST SETUP] Failed to parse .env file:', err);
    }
  }

  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // Handled by manual parse or file missing
    }
  }
}

// Automatically load on import
loadEnvFile();

export const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN || '';
export const hasValidToken = Boolean(GITHUB_TOKEN && GITHUB_TOKEN.trim().length > 0);

if (!hasValidToken) {
  console.warn('\n[TEST SETUP WARNING] process.env.VITE_GITHUB_TOKEN is missing or empty.');
  console.warn('Real-API integration tests will be skipped cleanly without failing.\n');
}

// Ensure in-memory storage polyfills exist for jsdom/node test runs
if (typeof globalThis.localStorage === 'undefined') {
  const storageMap = new Map();
  globalThis.localStorage = {
    getItem: (key) => storageMap.get(key) ?? null,
    setItem: (key, value) => storageMap.set(key, String(value)),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
    get length() { return storageMap.size; },
    key: (index) => Array.from(storageMap.keys())[index] ?? null,
  };
}

if (typeof globalThis.sessionStorage === 'undefined') {
  const sessionMap = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => sessionMap.get(key) ?? null,
    setItem: (key, value) => sessionMap.set(key, String(value)),
    removeItem: (key) => sessionMap.delete(key),
    clear: () => sessionMap.clear(),
    get length() { return sessionMap.size; },
    key: (index) => Array.from(sessionMap.keys())[index] ?? null,
  };
}
