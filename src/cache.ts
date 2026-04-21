import fs from "fs";
import path from "path";

export interface CacheEntry {
  key: string;
  value: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface CacheStore {
  entries: Record<string, CacheEntry>;
}

export function getCachePath(dir: string): string {
  return path.join(dir, ".envault", "cache.json");
}

export function loadCache(dir: string): CacheStore {
  const cachePath = getCachePath(dir);
  if (!fs.existsSync(cachePath)) return { entries: {} };
  try {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  } catch {
    return { entries: {} };
  }
}

export function saveCache(dir: string, store: CacheStore): void {
  const cachePath = getCachePath(dir);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(store, null, 2));
}

export function setCache(
  dir: string,
  key: string,
  value: string,
  ttlSeconds?: number
): CacheEntry {
  const store = loadCache(dir);
  const now = new Date();
  const entry: CacheEntry = {
    key,
    value,
    createdAt: now.toISOString(),
    expiresAt: ttlSeconds
      ? new Date(now.getTime() + ttlSeconds * 1000).toISOString()
      : null,
  };
  store.entries[key] = entry;
  saveCache(dir, store);
  return entry;
}

export function getCache(dir: string, key: string): CacheEntry | null {
  const store = loadCache(dir);
  const entry = store.entries[key];
  if (!entry) return null;
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    deleteCache(dir, key);
    return null;
  }
  return entry;
}

export function deleteCache(dir: string, key: string): boolean {
  const store = loadCache(dir);
  if (!store.entries[key]) return false;
  delete store.entries[key];
  saveCache(dir, store);
  return true;
}

export function clearCache(dir: string): number {
  const store = loadCache(dir);
  const count = Object.keys(store.entries).length;
  saveCache(dir, { entries: {} });
  return count;
}

export function pruneExpiredCache(dir: string): number {
  const store = loadCache(dir);
  const now = new Date();
  let pruned = 0;
  for (const key of Object.keys(store.entries)) {
    const entry = store.entries[key];
    if (entry.expiresAt && new Date(entry.expiresAt) < now) {
      delete store.entries[key];
      pruned++;
    }
  }
  saveCache(dir, store);
  return pruned;
}
