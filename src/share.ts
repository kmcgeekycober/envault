import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './vault';
import { encryptFile } from './gpg';

export interface ShareResult {
  recipient: string;
  outputPath: string;
  success: boolean;
  error?: string;
}

export async function shareEnvFile(
  envFilePath: string,
  recipientEmail: string,
  outputDir: string = '.'
): Promise<ShareResult> {
  const outputPath = path.join(outputDir, `${path.basename(envFilePath)}.${recipientEmail}.gpg`);
  try {
    await encryptFile(envFilePath, [recipientEmail], outputPath);
    return { recipient: recipientEmail, outputPath, success: true };
  } catch (error: any) {
    return { recipient: recipientEmail, outputPath, success: false, error: error.message };
  }
}

export async function shareWithAllRecipients(
  envFilePath: string,
  outputDir: string = '.'
): Promise<ShareResult[]> {
  const config = loadConfig();
  if (!config.recipients || config.recipients.length === 0) {
    throw new Error('No recipients configured. Add recipients with: envault key add <email>');
  }
  const results: ShareResult[] = [];
  for (const recipient of config.recipients) {
    const result = await shareEnvFile(envFilePath, recipient, outputDir);
    results.push(result);
  }
  return results;
}

export function formatShareResults(results: ShareResult[]): string {
  const lines = results.map(r =>
    r.success
      ? `  ✓ ${r.recipient} → ${r.outputPath}`
      : `  ✗ ${r.recipient}: ${r.error}`
  );
  const succeeded = results.filter(r => r.success).length;
  lines.push(`\n${succeeded}/${results.length} recipients succeeded.`);
  return lines.join('\n');
}
