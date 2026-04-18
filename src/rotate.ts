import { loadConfig, saveConfig } from './vault';
import { encryptFile, decryptFile } from './gpg';
import { getEncryptedFilePath } from './sync';
import { logAuditEntry, createAuditEntry } from './audit';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface RotateResult {
  envFile: string;
  encryptedFile: string;
  recipients: string[];
  timestamp: string;
}

export async function rotateEncryption(
  envFile: string,
  configPath: string
): Promise<RotateResult> {
  const config = await loadConfig(configPath);
  const recipients = config.recipients ?? [];

  if (recipients.length === 0) {
    throw new Error('No recipients configured. Add recipients before rotating.');
  }

  const encryptedFile = getEncryptedFilePath(envFile);

  // Decrypt existing file to temp buffer to verify it exists
  const tmpPath = `${envFile}.rotate.tmp`;
  try {
    await decryptFile(encryptedFile, tmpPath);
  } catch {
    // If no encrypted file yet, just encrypt current plaintext
    await fs.copyFile(envFile, tmpPath);
  }

  // Re-encrypt with current recipient list
  await encryptFile(tmpPath, encryptedFile, recipients);
  await fs.unlink(tmpPath);

  const timestamp = new Date().toISOString();
  const entry = createAuditEntry('rotate', envFile, { recipients });
  await logAuditEntry(path.join(path.dirname(configPath), '.envault-audit'), entry);

  return { envFile, encryptedFile, recipients, timestamp };
}

export async function rotateAll(configPath: string): Promise<RotateResult[]> {
  const config = await loadConfig(configPath);
  const envFiles: string[] = config.envFiles ?? ['.env'];
  const results: RotateResult[] = [];
  for (const f of envFiles) {
    results.push(await rotateEncryption(f, configPath));
  }
  return results;
}
