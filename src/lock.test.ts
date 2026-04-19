import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { getLockFilePath, acquireLock, releaseLock, readLock, formatLock } from './lock';

async function makeTmpDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envault-lock-'));
}

describe('lock', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('getLockFilePath returns path based on env file', () => {
    const p = getLockFilePath('.env');
    expect(p).toContain('.env.lock');
  });

  it('acquireLock creates a lock file', async () => {
    const entry = await acquireLock(path.join(tmpDir, '.env'), 'bob');
    expect(entry.lockedBy).toBe('bob');
    expect(entry.file).toContain('.env');
  });

  it('readLock returns null when no lock exists', async () => {
    const result = await readLock(path.join(tmpDir, '.env'));
    expect(result).toBeNull();
  });

  it('readLock returns entry after acquireLock', async () => {
    const envFile = path.join(tmpDir, '.env');
    await acquireLock(envFile, 'carol');
    const result = await readLock(envFile);
    expect(result).not.toBeNull();
    expect(result?.lockedBy).toBe('carol');
  });

  it('releaseLock removes the lock file', async () => {
    const envFile = path.join(tmpDir, '.env');
    await acquireLock(envFile, 'dave');
    await releaseLock(envFile);
    const result = await readLock(envFile);
    expect(result).toBeNull();
  });

  it('formatLock returns a readable string', () => {
    const entry = { file: '.env', lockedBy: 'eve', lockedAt: '2024-01-01T00:00:00.000Z', pid: 42 };
    const output = formatLock(entry);
    expect(output).toContain('eve');
    expect(output).toContain('.env');
  });
});
