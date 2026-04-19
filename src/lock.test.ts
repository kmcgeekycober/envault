import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { acquireLock, releaseLock, readLock, getLockFilePath, formatLock } from './lock';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lock-'));
}

describe('lock', () => {
  let dir: string;
  let envFile: string;

  beforeEach(() => {
    dir = makeTmpDir();
    envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'KEY=value');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true });
  });

  it('acquires a lock successfully', () => {
    const entry = acquireLock(envFile, 'alice');
    expect(entry).not.toBeNull();
    expect(entry?.user).toBe('alice');
    expect(fs.existsSync(getLockFilePath(envFile))).toBe(true);
  });

  it('returns null if lock already held', () => {
    acquireLock(envFile, 'alice');
    const second = acquireLock(envFile, 'bob');
    expect(second).toBeNull();
  });

  it('releases a lock by the same user', () => {
    acquireLock(envFile, 'alice');
    const released = releaseLock(envFile, 'alice');
    expect(released).toBe(true);
    expect(fs.existsSync(getLockFilePath(envFile))).toBe(false);
  });

  it('does not release lock owned by another user', () => {
    acquireLock(envFile, 'alice');
    const released = releaseLock(envFile, 'bob');
    expect(released).toBe(false);
  });

  it('readLock returns null when no lock exists', () => {
    expect(readLock(envFile)).toBeNull();
  });

  it('formatLock returns a readable string', () => {
    const entry = acquireLock(envFile, 'alice')!;
    const msg = formatLock(entry);
    expect(msg).toContain('alice');
    expect(msg).toContain('PID');
  });
});
