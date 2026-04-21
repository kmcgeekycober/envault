import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { loadConfig } from './vault';
import { encryptFile, decryptFile } from './gpg';

export interface SyncResult {
  status: 'pushed' | 'pulled' | 'up-to-date';
  file: string;
  timestamp: number;
}

export function getEncryptedFilePath(envFile: string): string {
  return envFile + '.gpg';
}

export async function pushEnv(envFile: string = '.env'): Promise<SyncResult> {
  const config = loadConfig();
  if (!config.recipients || config.recipients.length === 0) {
    throw new Error('No recipients configured. Add recipients before pushing.');
  }

  if (!fs.existsSync(envFile)) {
    throw new Error(`File not found: ${envFile}`);
  }

  const encryptedFile = getEncryptedFilePath(envFile);
  await encryptFile(envFile, encryptedFile, config.recipients);

  const timestamp = Date.now();
  const metaFile = encryptedFile + '.meta';
  fs.writeFileSync(metaFile, JSON.stringify({ timestamp, pushedBy: getGitUser() }));

  return { status: 'pushed', file: encryptedFile, timestamp };
}

export async function pullEnv(envFile: string = '.env'): Promise<SyncResult> {
  const encryptedFile = getEncryptedFilePath(envFile);

  if (!fs.existsSync(encryptedFile)) {
    throw new Error(`Encrypted file not found: ${encryptedFile}`);
  }

  const metaFile = encryptedFile + '.meta';
  const meta = fs.existsSync(metaFile)
    ? JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
    : { timestamp: 0 };

  if (fs.existsSync(envFile)) {
    const localMtime = fs.statSync(envFile).mtimeMs;
    if (localMtime >= meta.timestamp) {
      return { status: 'up-to-date', file: envFile, timestamp: meta.timestamp };
    }
  }

  await decryptFile(encryptedFile, envFile);
  return { status: 'pulled', file: envFile, timestamp: meta.timestamp };
}

export function getGitUser(): string {
  try {
    return execSync('git config user.email', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Reads and parses the metadata file for a given encrypted env file.
 * Returns null if the meta file does not exist.
 */
function readMeta(metaFile: string): { timestamp: number; pushedBy?: string } | null {
  if (!fs.existsSync(metaFile)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
  } catch {
    throw new Error(`Failed to parse metadata file: ${metaFile}`);
  }
}

/**
 * Returns sync status without modifying any files.
 * Compares local env file mtime against the pushed metadata timestamp.
 */
export function getSyncStatus(envFile: string = '.env'): SyncResult {
  const encryptedFile = getEncryptedFilePath(envFile);
  const metaFile = encryptedFile + '.meta';

  if (!fs.existsSync(encryptedFile)) {
    throw new Error(`Encrypted file not found: ${encryptedFile}`);
  }

  const meta = readMeta(metaFile) ?? { timestamp: 0 };

  if (!fs.existsSync(envFile)) {
    return { status: 'pulled', file: envFile, timestamp: meta.timestamp };
  }

  const localMtime = fs.statSync(envFile).mtimeMs;
  const status = localMtime >= meta.timestamp ? 'up-to-date' : 'pulled';
  return { status, file: envFile, timestamp: meta.timestamp };
}
