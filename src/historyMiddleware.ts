import * as crypto from 'crypto';
import * as fs from 'fs';
import { addHistoryEntry } from './history';
import { getGitUser } from './sync';

export function checksumFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return 'unknown';
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function withHistory(
  action: 'encrypt' | 'decrypt' | 'sync',
  file: string,
  fn: () => Promise<void>
): Promise<void> {
  await fn();
  const user = await getGitUser().catch(() => 'unknown');
  const checksum = checksumFile(file);
  addHistoryEntry({ action, file, user, checksum });
}
