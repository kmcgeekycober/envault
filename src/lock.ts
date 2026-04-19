import * as fs from 'fs';
import * as path from 'path';

export interface LockEntry {
  file: string;
  user: string;
  timestamp: string;
  pid: number;
}

export function getLockFilePath(envFile: string): string {
  return envFile + '.lock';
}

export function acquireLock(envFile: string, user: string): LockEntry | null {
  const lockPath = getLockFilePath(envFile);
  if (fs.existsSync(lockPath)) {
    const existing = readLock(envFile);
    if (existing) return null;
  }
  const entry: LockEntry = {
    file: envFile,
    user,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  };
  fs.writeFileSync(lockPath, JSON.stringify(entry, null, 2));
  return entry;
}

export function releaseLock(envFile: string, user: string): boolean {
  const lockPath = getLockFilePath(envFile);
  if (!fs.existsSync(lockPath)) return false;
  const lock = readLock(envFile);
  if (!lock || lock.user !== user) return false;
  fs.unlinkSync(lockPath);
  return true;
}

export function readLock(envFile: string): LockEntry | null {
  const lockPath = getLockFilePath(envFile);
  if (!fs.existsSync(lockPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf-8')) as LockEntry;
  } catch {
    return null;
  }
}

export function formatLock(lock: LockEntry): string {
  return `Locked by ${lock.user} at ${lock.timestamp} (PID ${lock.pid})`;
}
