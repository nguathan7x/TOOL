type MemoryCacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

type PersistedCacheEntry<T> = {
  expiresAt: number;
  data: T;
};

const memoryCache = new Map<string, MemoryCacheEntry<unknown>>();
const STORAGE_PREFIX = 'superboss.request-cache';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toStorageKey(key: string) {
  return `${STORAGE_PREFIX}:${key}`;
}

function readPersistedEntry<T>(key: string): PersistedCacheEntry<T> | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(toStorageKey(key));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedCacheEntry<T>;
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(toStorageKey(key));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistEntry<T>(key: string, entry: PersistedCacheEntry<T>) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(toStorageKey(key), JSON.stringify(entry));
  } catch {
    // Ignore storage quota issues and keep memory cache only.
  }
}

function removePersistedEntries(prefix: string) {
  if (!canUseStorage()) {
    return;
  }

  const storagePrefix = toStorageKey(prefix);
  const keysToDelete: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(storagePrefix)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => window.localStorage.removeItem(key));
}

export type ScopedRequestCache = {
  read<T>(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T>;
  invalidate(prefix?: string): void;
};

export function createScopedRequestCache(scope: string): ScopedRequestCache {
  const scopedPrefix = `${scope}:`;

  return {
    read<T>(key: string, loader: () => Promise<T>, ttlMs = 15_000) {
      const cacheKey = `${scopedPrefix}${key}`;
      const now = Date.now();
      const inMemory = memoryCache.get(cacheKey);

      if (inMemory && inMemory.expiresAt > now) {
        return inMemory.promise as Promise<T>;
      }

      const persisted = readPersistedEntry<T>(cacheKey);
      if (persisted) {
        const promise = Promise.resolve(persisted.data);
        memoryCache.set(cacheKey, {
          expiresAt: persisted.expiresAt,
          promise
        });
        return promise;
      }

      const expiresAt = now + ttlMs;
      const promise = loader()
        .then((data) => {
          persistEntry(cacheKey, { expiresAt, data });
          return data;
        })
        .catch((error) => {
          memoryCache.delete(cacheKey);
          removePersistedEntries(cacheKey);
          throw error;
        });

      memoryCache.set(cacheKey, { expiresAt, promise });
      return promise;
    },

    invalidate(prefix = '') {
      const cachePrefix = `${scopedPrefix}${prefix}`;

      Array.from(memoryCache.keys()).forEach((key) => {
        if (key.startsWith(cachePrefix)) {
          memoryCache.delete(key);
        }
      });

      removePersistedEntries(cachePrefix);
    }
  };
}
