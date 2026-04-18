import * as fs from 'fs';
import * as path from 'path';
import { decryptFile } from './gpg';

export type ExportFormat = 'dotenv' | 'json' | 'shell';

export function formatEnvJson(vars: Record<string, string>): string {
  return JSON.stringify(vars, null, 2);
}

export function formatEnvShell(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `export ${k}=${JSON.stringify(v)}`)
    .join('\n');
}

export function formatEnvDotenv(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

export function parseDecryptedEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

export async function exportVault(
  encryptedFile: string,
  format: ExportFormat = 'dotenv',
  outputFile?: string
): Promise<string> {
  const decrypted = await decryptFile(encryptedFile);
  const vars = parseDecryptedEnv(decrypted);

  let output: string;
  if (format === 'json') output = formatEnvJson(vars);
  else if (format === 'shell') output = formatEnvShell(vars);
  else output = formatEnvDotenv(vars);

  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, output, 'utf-8');
  }

  return output;
}
