import * as fs from 'fs';
import { parseEnvFile } from './diff';
import { loadTemplate } from './template';

export interface EnvCheckResult {
  file: string;
  missing: string[];
  extra: string[];
  valid: boolean;
}

export function formatEnvCheckResult(result: EnvCheckResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  if (result.valid) {
    lines.push('  ✓ All required keys present');
  } else {
    if (result.missing.length > 0) {
      lines.push(`  ✗ Missing keys: ${result.missing.join(', ')}`);
    }
    if (result.extra.length > 0) {
      lines.push(`  ! Extra keys: ${result.extra.join(', ')}`);
    }
  }
  return lines.join('\n');
}

export async function checkEnvFile(
  envPath: string,
  templatePath: string
): Promise<EnvCheckResult> {
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const envKeys = new Set(Object.keys(parseEnvFile(envContent)));

  const template = await loadTemplate(templatePath);
  const requiredKeys = new Set(
    template.keys.filter((k) => k.required).map((k) => k.name)
  );
  const allTemplateKeys = new Set(template.keys.map((k) => k.name));

  const missing = [...requiredKeys].filter((k) => !envKeys.has(k));
  const extra = [...envKeys].filter((k) => !allTemplateKeys.has(k));

  return {
    file: envPath,
    missing,
    extra,
    valid: missing.length === 0,
  };
}
