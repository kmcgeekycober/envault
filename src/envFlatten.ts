import * as fs from "fs";
import * as path from "path";

export interface FlattenOptions {
  prefix?: string;
  separator?: string;
  uppercase?: boolean;
}

export interface FlattenResult {
  original: Record<string, string>;
  flattened: Record<string, string>;
  count: number;
  skipped: string[];
}

export function flattenEnvKey(
  key: string,
  opts: FlattenOptions = {}
): string {
  const sep = opts.separator ?? "_";
  let result = key.replace(/[^a-zA-Z0-9_]/g, sep);
  if (opts.prefix) {
    result = `${opts.prefix}${sep}${result}`;
  }
  return opts.uppercase !== false ? result.toUpperCase() : result;
}

export function flattenEnvEntries(
  entries: Record<string, string>,
  opts: FlattenOptions = {}
): FlattenResult {
  const flattened: Record<string, string> = {};
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(entries)) {
    const flatKey = flattenEnvKey(key, opts);
    if (flatKey in flattened) {
      skipped.push(key);
      continue;
    }
    flattened[flatKey] = value;
  }

  return {
    original: entries,
    flattened,
    count: Object.keys(flattened).length,
    skipped,
  };
}

export function flattenEnvFile(
  filePath: string,
  opts: FlattenOptions = {}
): FlattenResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const entries: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    entries[key] = value;
  }

  return flattenEnvEntries(entries, opts);
}

export function formatFlattenResult(result: FlattenResult): string {
  const lines: string[] = [];
  lines.push(`Flattened ${result.count} key(s).`);
  if (result.skipped.length > 0) {
    lines.push(`Skipped (collision): ${result.skipped.join(", ")}`);
  }
  return lines.join("\n");
}
