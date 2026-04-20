import * as fs from "fs";
import * as path from "path";

export interface TtlEntry {
  key: string;
  expiresAt: number; // Unix timestamp ms
  file: string;
}

export interface TtlConfig {
  entries: TtlEntry[];
}

export function getTtlPath(dir: string): string {
  return path.join(dir, ".envault", "ttl.json");
}

export function loadTtlConfig(dir: string): TtlConfig {
  const p = getTtlPath(dir);
  if (!fs.existsSync(p)) return { entries: [] };
  return JSON.parse(fs.readFileSync(p, "utf8")) as TtlConfig;
}

export function saveTtlConfig(dir: string, config: TtlConfig): void {
  const p = getTtlPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2));
}

export function setTtl(
  dir: string,
  file: string,
  key: string,
  ttlSeconds: number
): TtlEntry {
  const config = loadTtlConfig(dir);
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const entry: TtlEntry = { key, expiresAt, file };
  config.entries = config.entries.filter(
    (e) => !(e.key === key && e.file === file)
  );
  config.entries.push(entry);
  saveTtlConfig(dir, config);
  return entry;
}

export function removeTtl(dir: string, file: string, key: string): boolean {
  const config = loadTtlConfig(dir);
  const before = config.entries.length;
  config.entries = config.entries.filter(
    (e) => !(e.key === key && e.file === file)
  );
  saveTtlConfig(dir, config);
  return config.entries.length < before;
}

export function getExpiredEntries(dir: string): TtlEntry[] {
  const config = loadTtlConfig(dir);
  const now = Date.now();
  return config.entries.filter((e) => e.expiresAt <= now);
}

export function formatTtlEntry(entry: TtlEntry): string {
  const remaining = entry.expiresAt - Date.now();
  if (remaining <= 0) return `${entry.key} (${entry.file}) — EXPIRED`;
  const secs = Math.ceil(remaining / 1000);
  return `${entry.key} (${entry.file}) — expires in ${secs}s`;
}
