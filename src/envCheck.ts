import * as fs from 'fs';
import { parseEnvFile } from './diff';
import { loadTemplate } from './template';

export interface EnvCheckResult {
  file: string;
  missing: string[];
  extra: string[];
  ok: boolean;
}

export async function checkEnvAgainstTemplate(
  envFile: string,
  templateFile: string
): Promise<EnvCheckResult> {
  if (!fs.existsSync(envFile)) {
    throw new Error(`Env file not found: ${envFile}`);
  }
  if (!fs.existsSync(templateFile)) {
    throw new Error(`Template file not found: ${templateFile}`);
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const envKeys = new Set(Object.keys(parseEnvFile(envContent)));

  const template = await loadTemplate(templateFile);
  const templateKeys = new Set(template.keys.map((k) => k.name));

  const missing = [...templateKeys].filter((k) => !envKeys.has(k));
  const extra = [...envKeys].filter((k) => !templateKeys.has(k));

  return {
    file: envFile,
    missing,
    extra,
    ok: missing.length === 0,
  };
}

export function formatEnvCheckResult(result: EnvCheckResult): string {
  const lines: string[] = [];
  if (result.ok && result.extra.length === 0) {
    lines.push(`✔ ${result.file} matches template.`);
    return lines.join('\n');
  }
  if (result.missing.length > 0) {
    lines.push(`✖ Missing keys in ${result.file}:`);
    result.missing.forEach((k) => lines.push(`  - ${k}`));
  }
  if (result.extra.length > 0) {
    lines.push(`⚠ Extra keys not in template:`);
    result.extra.forEach((k) => lines.push(`  + ${k}`));
  }
  return lines.join('\n');
}
