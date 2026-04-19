import * as path from 'path';
import { loadConfig } from './vault';

export interface WatchContext {
  envFile: string;
  vaultDir: string;
  recipients: string[];
}

export async function buildWatchContext(
  envFile: string,
  vaultDir: string
): Promise<WatchContext> {
  const resolvedEnv = path.resolve(envFile);
  const resolvedVault = path.resolve(vaultDir);

  const config = await loadConfig(resolvedVault);
  const recipients: string[] = config.recipients ?? [];

  if (recipients.length === 0) {
    throw new Error(
      'No recipients found in vault config. Add recipients before watching.'
    );
  }

  return {
    envFile: resolvedEnv,
    vaultDir: resolvedVault,
    recipients,
  };
}

export function logWatchEvent(envFile: string, encryptedPath: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] Changed: ${path.basename(envFile)} → ${path.basename(encryptedPath)}`);
}
