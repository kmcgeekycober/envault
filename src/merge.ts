import * as fs from "fs";
import { parseEnvFile } from "./diff";

export type MergeStrategy = "ours" | "theirs" | "interactive";

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: string[];
  added: string[];
  overwritten: string[];
}

export function mergeEnvFiles(
  base: Record<string, string>,
  incoming: Record<string, string>,
  strategy: MergeStrategy = "ours"
): MergeResult {
  const merged: Record<string, string> = { ...base };
  const conflicts: string[] = [];
  const added: string[] = [];
  const overwritten: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in base)) {
      merged[key] = value;
      added.push(key);
    } else if (base[key] !== value) {
      conflicts.push(key);
      if (strategy === "theirs") {
        merged[key] = value;
        overwritten.push(key);
      }
      // strategy "ours" keeps base value (already set)
    }
  }

  return { merged, conflicts, added, overwritten };
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];

  if (result.added.length > 0) {
    lines.push(`Added keys (${result.added.length}):`);
    for (const key of result.added) lines.push(`  + ${key}`);
  }

  if (result.conflicts.length > 0) {
    lines.push(`Conflicting keys (${result.conflicts.length}):`);
    for (const key of result.conflicts) {
      const resolved = result.overwritten.includes(key) ? "resolved:theirs" : "resolved:ours";
      lines.push(`  ~ ${key} [${resolved}]`);
    }
  }

  if (result.added.length === 0 && result.conflicts.length === 0) {
    lines.push("No conflicts. Files merged cleanly.");
  }

  return lines.join("\n");
}

export function mergeEnvFilePaths(
  basePath: string,
  incomingPath: string,
  strategy: MergeStrategy = "ours"
): MergeResult {
  const baseContent = fs.readFileSync(basePath, "utf-8");
  const incomingContent = fs.readFileSync(incomingPath, "utf-8");
  const base = parseEnvFile(baseContent);
  const incoming = parseEnvFile(incomingContent);
  return mergeEnvFiles(base, incoming, strategy);
}

export function serializeMerged(merged: Record<string, string>): string {
  return Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}
