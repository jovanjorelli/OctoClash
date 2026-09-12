const APP_STORAGE_PREFIX = 'octoclash_';
const APP_STORAGE_KEYS = new Set(['octoclash-storage']);

function getStorageKeys(storage) {
  const keys = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

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

export function clearOctoClashStorage() {
  clearMatchingStorage(window.localStorage);
}

export function clearOctoClashSession() {
  clearMatchingStorage(window.sessionStorage);
}
