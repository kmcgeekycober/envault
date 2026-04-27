import * as fs from "fs";
import { parseEnvEntries, serializeEnvEntries } from "./env";

export interface ReplaceResult {
  key: string;
  oldValue: string;
  newValue: string;
  replaced: boolean;
}

export interface EnvReplaceResult {
  results: ReplaceResult[];
  totalReplaced: number;
  filePath: string;
}

export function replaceEnvValue(
  entries: Record<string, string>,
  key: string,
  newValue: string
): ReplaceResult {
  const oldValue = entries[key];
  if (oldValue === undefined) {
    return { key, oldValue: "", newValue, replaced: false };
  }
  entries[key] = newValue;
  return { key, oldValue, newValue, replaced: true };
}

export function replaceEnvValues(
  entries: Record<string, string>,
  replacements: Record<string, string>
): ReplaceResult[] {
  return Object.entries(replacements).map(([key, newValue]) =>
    replaceEnvValue(entries, key, newValue)
  );
}

export function replaceEnvInFile(
  filePath: string,
  replacements: Record<string, string>
): EnvReplaceResult {
  const raw = fs.readFileSync(filePath, "utf-8");
  const entries = parseEnvEntries(raw);
  const results = replaceEnvValues(entries, replacements);
  const replaced = results.filter((r) => r.replaced);
  if (replaced.length > 0) {
    const serialized = serializeEnvEntries(entries);
    fs.writeFileSync(filePath, serialized, "utf-8");
  }
  return { results, totalReplaced: replaced.length, filePath };
}

export function formatReplaceResult(result: EnvReplaceResult): string {
  const lines: string[] = [`File: ${result.filePath}`];
  for (const r of result.results) {
    if (r.replaced) {
      lines.push(`  ✔ ${r.key}: "${r.oldValue}" → "${r.newValue}"`);
    } else {
      lines.push(`  ✘ ${r.key}: key not found`);
    }
  }
  lines.push(`\n${result.totalReplaced} replacement(s) made.`);
  return lines.join("\n");
}
