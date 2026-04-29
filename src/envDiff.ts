import * as fs from "fs";
import { parseEnvEntries } from "./env";

export interface EnvDiffEntry {
  key: string;
  type: "added" | "removed" | "changed";
  oldValue?: string;
  newValue?: string;
}

export interface EnvDiffResult {
  entries: EnvDiffEntry[];
  added: number;
  removed: number;
  changed: number;
}

export function diffEnvEntries(
  base: Record<string, string>,
  target: Record<string, string>
): EnvDiffResult {
  const entries: EnvDiffEntry[] = [];

  for (const key of Object.keys(target)) {
    if (!(key in base)) {
      entries.push({ key, type: "added", newValue: target[key] });
    } else if (base[key] !== target[key]) {
      entries.push({ key, type: "changed", oldValue: base[key], newValue: target[key] });
    }
  }

  for (const key of Object.keys(base)) {
    if (!(key in target)) {
      entries.push({ key, type: "removed", oldValue: base[key] });
    }
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));

  return {
    entries,
    added: entries.filter((e) => e.type === "added").length,
    removed: entries.filter((e) => e.type === "removed").length,
    changed: entries.filter((e) => e.type === "changed").length,
  };
}

export function diffEnvFiles(basePath: string, targetPath: string): EnvDiffResult {
  const baseContent = fs.existsSync(basePath) ? fs.readFileSync(basePath, "utf8") : "";
  const targetContent = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf8") : "";

  const base = Object.fromEntries(parseEnvEntries(baseContent).map((e) => [e.key, e.value]));
  const target = Object.fromEntries(parseEnvEntries(targetContent).map((e) => [e.key, e.value]));

  return diffEnvEntries(base, target);
}

export function formatEnvDiffResult(result: EnvDiffResult, maskValues = false): string {
  if (result.entries.length === 0) {
    return "No differences found.";
  }

  const mask = (v?: string) => (maskValues ? "***" : v ?? "");
  const lines: string[] = [];

  for (const entry of result.entries) {
    if (entry.type === "added") {
      lines.push(`+ ${entry.key}=${mask(entry.newValue)}`);
    } else if (entry.type === "removed") {
      lines.push(`- ${entry.key}=${mask(entry.oldValue)}`);
    } else {
      lines.push(`~ ${entry.key}: ${mask(entry.oldValue)} -> ${mask(entry.newValue)}`);
    }
  }

  lines.push("");
  lines.push(
    `Summary: ${result.added} added, ${result.removed} removed, ${result.changed} changed`
  );

  return lines.join("\n");
}
