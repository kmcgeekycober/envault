import * as fs from "fs";
import * as path from "path";
import { readEnvFile, writeEnvFile, parseEnvEntries, serializeEnvEntries } from "./env";

export interface CloneOptions {
  keys?: string[];
  exclude?: string[];
  overwrite?: boolean;
}

export interface CloneResult {
  source: string;
  destination: string;
  cloned: string[];
  skipped: string[];
  overwritten: string[];
}

export function cloneEnvFile(
  sourcePath: string,
  destPath: string,
  options: CloneOptions = {}
): CloneResult {
  const sourceContent = readEnvFile(sourcePath);
  const sourceEntries = parseEnvEntries(sourceContent);

  let destEntries: Record<string, string> = {};
  if (fs.existsSync(destPath)) {
    const destContent = readEnvFile(destPath);
    destEntries = parseEnvEntries(destContent);
  }

  const cloned: string[] = [];
  const skipped: string[] = [];
  const overwritten: string[] = [];

  for (const [key, value] of Object.entries(sourceEntries)) {
    if (options.keys && !options.keys.includes(key)) continue;
    if (options.exclude && options.exclude.includes(key)) continue;

    if (key in destEntries) {
      if (!options.overwrite) {
        skipped.push(key);
        continue;
      }
      overwritten.push(key);
    } else {
      cloned.push(key);
    }
    destEntries[key] = value;
  }

  const merged = serializeEnvEntries(destEntries);
  writeEnvFile(destPath, merged);

  return {
    source: sourcePath,
    destination: destPath,
    cloned,
    skipped,
    overwritten,
  };
}

export function formatCloneResult(result: CloneResult): string {
  const lines: string[] = [
    `Cloned: ${result.source} → ${result.destination}`,
    `  Cloned:      ${result.cloned.length} key(s)${result.cloned.length ? " (" + result.cloned.join(", ") + ")" : ""}`,
    `  Overwritten: ${result.overwritten.length} key(s)${result.overwritten.length ? " (" + result.overwritten.join(", ") + ")" : ""}`,
    `  Skipped:     ${result.skipped.length} key(s)${result.skipped.length ? " (" + result.skipped.join(", ") + ")" : ""}`,
  ];
  return lines.join("\n");
}
