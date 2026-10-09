// Prefix and keys managed by OctoClash across localStorage and sessionStorage
const APP_STORAGE_PREFIX = 'octoclash_';
const APP_STORAGE_KEYS = new Set(['octoclash-storage']);

/**
 * Extracts all key names currently stored in a Web Storage instance.
 * @param {Storage} storage - localStorage or sessionStorage instance.
 * @returns {string[]} Array of storage keys.
 */
function getStorageKeys(storage) {
  const keys = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

/**
 * Deletes all keys created by OctoClash while leaving unrelated domain keys untouched.
 * @param {Storage} storage - Target storage container.
 */
function clearMatchingStorage(storage) {
  if (!storage) return;

  try {
    const keys = getStorageKeys(storage);
    for (const key of keys) {
      if (APP_STORAGE_KEYS.has(key) || key.startsWith(APP_STORAGE_PREFIX)) {
        storage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Unable to clear app storage.', error);
  }
}

/**
 * Clears OctoClash application state, repository list, and API response cache from localStorage.
 */
export function clearOctoClashStorage() {
  clearMatchingStorage(window.localStorage);
}

/**
 * Clears session-scoped sensitive data (such as the GitHub Personal Access Token) from sessionStorage.
 */
export function clearOctoClashSession() {
  clearMatchingStorage(window.sessionStorage);
}
