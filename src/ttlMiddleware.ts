import { getExpiredEntries, formatTtlEntry } from "./ttl";

export interface TtlWarning {
  key: string;
  file: string;
  expiresAt: number;
}

export function checkTtlExpiry(
  dir: string,
  opts: { warn?: boolean; exit?: boolean } = {}
): TtlWarning[] {
  const expired = getExpiredEntries(dir);
  if (expired.length === 0) return [];

  const warnings: TtlWarning[] = expired.map((e) => ({
    key: e.key,
    file: e.file,
    expiresAt: e.expiresAt,
  }));

  if (opts.warn !== false) {
    console.warn("[envault] Warning: the following keys have expired TTLs:");
    expired.forEach((e) => console.warn("  " + formatTtlEntry(e)));
  }

  if (opts.exit) {
    process.exit(1);
  }

  return warnings;
}

export function withTtlCheck(
  dir: string,
  fn: () => void | Promise<void>,
  opts: { warn?: boolean; exit?: boolean } = {}
): void | Promise<void> {
  checkTtlExpiry(dir, opts);
  return fn();
}
