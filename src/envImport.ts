import * as fs from "fs";
import * as path from "path";

export interface ImportResult {
  imported: number;
  skipped: number;
  keys: string[];
  skippedKeys: string[];
}

export type ImportStrategy = "overwrite" | "skip" | "merge";

export function parseImportSource(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

export function importEnvKeys(
  existing: Record<string, string>,
  incoming: Record<string, string>,
  strategy: ImportStrategy = "skip"
): { merged: Record<string, string>; result: ImportResult } {
  const merged = { ...existing };
  const keys: string[] = [];
  const skippedKeys: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (strategy === "skip" && key in existing) {
      skippedKeys.push(key);
      continue;
    }
    merged[key] = value;
    keys.push(key);
  }

  return {
    merged,
    result: {
      imported: keys.length,
      skipped: skippedKeys.length,
      keys,
      skippedKeys,
    },
  };
}

export function serializeEnv(env: Record<string, string>): string {
  return (
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n"
  );
}

export function formatImportResult(result: ImportResult): string {
  const lines: string[] = [];
  lines.push(`Imported ${result.imported} key(s), skipped ${result.skipped} key(s).`);
  if (result.keys.length > 0) {
    lines.push(`  Added: ${result.keys.join(", ")}`);
  }
  if (result.skippedKeys.length > 0) {
    lines.push(`  Skipped: ${result.skippedKeys.join(", ")}`);
  }
  return lines.join("\n");
}
