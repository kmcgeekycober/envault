import * as fs from "fs";
import * as path from "path";
import { parseEnvFile } from "./diff";
import { loadTemplate } from "./template";

export interface EnvCheckResult {
  file: string;
  missing: string[];
  extra: string[];
  empty: string[];
  valid: boolean;
}

/**
 * Check an env file against a template for missing/extra/empty keys.
 */
export function checkEnvFile(
  envPath: string,
  templatePath: string
): EnvCheckResult {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = parseEnvFile(envContent);
  const template = loadTemplate(templatePath);

  const envKeys = new Set(Object.keys(envVars));
  const templateKeys = new Set(template.keys.map((k) => k.name));

  const missing: string[] = [];
  const extra: string[] = [];
  const empty: string[] = [];

  for (const key of templateKeys) {
    if (!envKeys.has(key)) {
      missing.push(key);
    }
  }

  for (const key of envKeys) {
    if (!templateKeys.has(key)) {
      extra.push(key);
    }
    if (envVars[key] === "") {
      empty.push(key);
    }
  }

  return {
    file: path.basename(envPath),
    missing,
    extra,
    empty,
    valid: missing.length === 0 && empty.length === 0,
  };
}

/**
 * Format an EnvCheckResult for CLI output.
 */
export function formatEnvCheckResult(result: EnvCheckResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);

  if (result.valid) {
    lines.push("  ✔ All required keys present and non-empty.");
  } else {
    if (result.missing.length > 0) {
      lines.push(`  ✘ Missing keys (${result.missing.length}):`);
      for (const k of result.missing) {
        lines.push(`      - ${k}`);
      }
    }
    if (result.empty.length > 0) {
      lines.push(`  ⚠ Empty keys (${result.empty.length}):`);
      for (const k of result.empty) {
        lines.push(`      - ${k}`);
      }
    }
  }

  if (result.extra.length > 0) {
    lines.push(`  ℹ Extra keys not in template (${result.extra.length}):`);
    for (const k of result.extra) {
      lines.push(`      - ${k}`);
    }
  }

  return lines.join("\n");
}
