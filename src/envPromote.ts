import * as fs from "fs";
import { parseEnvEntries, serializeEnvEntries, EnvEntry } from "./env";

export interface PromoteResult {
  promoted: string[];
  skipped: string[];
  overwritten: string[];
}

export function promoteEnvKeys(
  sourceEntries: EnvEntry[],
  targetEntries: EnvEntry[],
  keys: string[],
  overwrite = false
): { entries: EnvEntry[]; result: PromoteResult } {
  const result: PromoteResult = { promoted: [], skipped: [], overwritten: [] };
  const targetMap = new Map(targetEntries.map((e) => [e.key, e]));

  for (const key of keys) {
    const sourceEntry = sourceEntries.find((e) => e.key === key);
    if (!sourceEntry) {
      result.skipped.push(key);
      continue;
    }
    if (targetMap.has(key)) {
      if (!overwrite) {
        result.skipped.push(key);
        continue;
      }
      result.overwritten.push(key);
    } else {
      result.promoted.push(key);
    }
    targetMap.set(key, { ...sourceEntry });
  }

  return { entries: Array.from(targetMap.values()), result };
}

export function promoteEnvFile(
  sourcePath: string,
  targetPath: string,
  keys: string[],
  overwrite = false
): PromoteResult {
  const sourceContent = fs.readFileSync(sourcePath, "utf8");
  const targetContent = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : "";

  const sourceEntries = parseEnvEntries(sourceContent);
  const targetEntries = parseEnvEntries(targetContent);

  const { entries, result } = promoteEnvKeys(
    sourceEntries,
    targetEntries,
    keys,
    overwrite
  );

  fs.writeFileSync(targetPath, serializeEnvEntries(entries), "utf8");
  return result;
}

export function formatPromoteResult(
  result: PromoteResult,
  source: string,
  target: string
): string {
  const lines: string[] = [`Promote: ${source} → ${target}`];
  if (result.promoted.length)
    lines.push(`  Promoted:    ${result.promoted.join(", ")}`);
  if (result.overwritten.length)
    lines.push(`  Overwritten: ${result.overwritten.join(", ")}`);
  if (result.skipped.length)
    lines.push(`  Skipped:     ${result.skipped.join(", ")}`);
  if (!result.promoted.length && !result.overwritten.length)
    lines.push("  No keys promoted.");
  return lines.join("\n");
}
