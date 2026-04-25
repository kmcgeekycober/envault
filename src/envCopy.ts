import * as fs from "fs";
import { parseEnvEntries, serializeEnvEntries } from "./env";

export interface CopyResult {
  key: string;
  fromFile: string;
  toFile: string;
  overwritten: boolean;
  skipped: boolean;
}

export function copyEnvKey(
  key: string,
  fromEntries: Record<string, string>,
  toEntries: Record<string, string>,
  overwrite = false
): { updated: Record<string, string>; overwritten: boolean; skipped: boolean } {
  const exists = key in toEntries;
  if (exists && !overwrite) {
    return { updated: toEntries, overwritten: false, skipped: true };
  }
  return {
    updated: { ...toEntries, [key]: fromEntries[key] },
    overwritten: exists,
    skipped: false,
  };
}

export function copyEnvKeyInFiles(
  key: string,
  fromFile: string,
  toFile: string,
  overwrite = false
): CopyResult {
  if (!fs.existsSync(fromFile)) {
    throw new Error(`Source file not found: ${fromFile}`);
  }
  const fromContent = fs.readFileSync(fromFile, "utf8");
  const fromEntries = parseEnvEntries(fromContent);

  if (!(key in fromEntries)) {
    throw new Error(`Key "${key}" not found in ${fromFile}`);
  }

  const toContent = fs.existsSync(toFile) ? fs.readFileSync(toFile, "utf8") : "";
  const toEntries = parseEnvEntries(toContent);

  const { updated, overwritten, skipped } = copyEnvKey(key, fromEntries, toEntries, overwrite);

  if (!skipped) {
    fs.writeFileSync(toFile, serializeEnvEntries(updated), "utf8");
  }

  return { key, fromFile, toFile, overwritten, skipped };
}

export function formatCopyResult(result: CopyResult): string {
  if (result.skipped) {
    return `Skipped: "${result.key}" already exists in ${result.toFile} (use --overwrite to replace)`;
  }
  const action = result.overwritten ? "Overwrote" : "Copied";
  return `${action}: "${result.key}" from ${result.fromFile} → ${result.toFile}`;
}
