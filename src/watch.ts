import * as fs from 'fs';
import * as path from 'path';
import { encryptFile } from './gpg';
import { loadConfig } from './vault';
import { addHistoryEntry } from './history';
import { checksumFile } from './historyMiddleware';

export interface WatchOptions {
  envFile: string;
  vaultDir: string;
  onEncrypt?: (file: string) => void;
  onError?: (err: Error) => void;
}

export interface WatchHandle {
  stop: () => void;
}

export async function watchEnvFile(options: WatchOptions): Promise<WatchHandle> {
  const { envFile, vaultDir, onEncrypt, onError } = options;
  let lastChecksum = await checksumFile(envFile).catch(() => '');

  const watcher = fs.watch(envFile, async (eventType) => {
    if (eventType !== 'change') return;
    try {
      const newChecksum = await checksumFile(envFile);
      if (newChecksum === lastChecksum) return;
      lastChecksum = newChecksum;

      const config = await loadConfig(vaultDir);
      const recipients = config.recipients ?? [];
      if (recipients.length === 0) throw new Error('No recipients configured');

      const encryptedPath = path.join(vaultDir, path.basename(envFile) + '.gpg');
      await encryptFile(envFile, encryptedPath, recipients);
      await addHistoryEntry(vaultDir, envFile, 'watch-encrypt', newChecksum);

      if (onEncrypt) onEncrypt(encryptedPath);
    } catch (err) {
      if (onError) onError(err as Error);
    }
  });

  return {
    stop: () => watcher.close(),
  };
}
