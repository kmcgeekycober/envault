import * as path from "path";
import { compareEnvFiles, EnvCompareResult } from "./envCompare";

export interface CompareContext {
  envFile: string;
  referenceFile?: string;
  compareResult?: EnvCompareResult;
}

/**
 * Middleware that auto-compares the active env file against a reference file
 * (e.g., .env.example) before a command runs, warning on missing or extra keys.
 */
export function withEnvCompare(
  ctx: CompareContext,
  referenceFile?: string
): EnvCompareResult | null {
  const ref = referenceFile ?? ctx.referenceFile;
  if (!ref) return null;

  const result = compareEnvFiles(ctx.envFile, ref);
  ctx.compareResult = result;

  if (result.rightOnlyCount > 0) {
    const keys = result.entries
      .filter((e) => e.status === "right-only")
      .map((e) => e.key);
    console.warn(
      `[envault] Warning: ${result.rightOnlyCount} key(s) present in ` +
        `${path.basename(ref)} but missing from ${path.basename(ctx.envFile)}: ` +
        keys.join(", ")
    );
  }

  if (result.leftOnlyCount > 0) {
    const keys = result.entries
      .filter((e) => e.status === "left-only")
      .map((e) => e.key);
    console.warn(
      `[envault] Info: ${result.leftOnlyCount} key(s) in ` +
        `${path.basename(ctx.envFile)} not found in reference: ` +
        keys.join(", ")
    );
  }

  return result;
}

/**
 * Returns true when the env file is fully in sync with the reference
 * (no missing or extra keys, regardless of values).
 */
export function isStructuralMatch(result: EnvCompareResult): boolean {
  return result.leftOnlyCount === 0 && result.rightOnlyCount === 0;
}
