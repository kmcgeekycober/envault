import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  freezeEnvFile,
  loadFreezeManifest,
  checkFrozenKeys,
  computeChecksum,
  formatFreezeResult,
  getFreezePath,
} from './envFreeze';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envfreeze-'));
}

function writeEnv(dir: string, content: string): string {
  const p = path.join(dir, '.env');
  fs.writeFileSync(p, content);
  return p;
}

describe('computeChecksum', () => {
  it('returns same checksum for same keys regardless of order', () => {
    const a = computeChecksum(['FOO', 'BAR', 'BAZ']);
    const b = computeChecksum(['BAZ', 'FOO', 'BAR']);
    expect(a).toBe(b);
  });

  it('returns different checksum for different keys', () => {
    expect(computeChecksum(['FOO'])).not.toBe(computeChecksum(['BAR']));
  });
});

describe('freezeEnvFile', () => {
  it('creates a freeze manifest with correct keys', () => {
    const dir = makeTmpDir();
    const file = writeEnv(dir, 'FOO=1\nBAR=2\n# comment\nBAZ=3\n');
    const manifest = freezeEnvFile(file, dir);
    expect(manifest.keys).toEqual(expect.arrayContaining(['FOO', 'BAR', 'BAZ']));
    expect(manifest.keys).toHaveLength(3);
    expect(manifest.file).toBe(file);
    expect(manifest.frozenAt).toBeTruthy();
  });

  it('saves manifest to disk', () => {
    const dir = makeTmpDir();
    const file = writeEnv(dir, 'A=1\nB=2\n');
    freezeEnvFile(file, dir);
    const p = getFreezePath(dir);
    expect(fs.existsSync(p)).toBe(true);
  });
});

describe('loadFreezeManifest', () => {
  it('returns null when no manifest exists', () => {
    const dir = makeTmpDir();
    expect(loadFreezeManifest(dir)).toBeNull();
  });

  it('returns manifest after freeze', () => {
    const dir = makeTmpDir();
    const file = writeEnv(dir, 'X=1\n');
    freezeEnvFile(file, dir);
    const manifest = loadFreezeManifest(dir);
    expect(manifest).not.toBeNull();
    expect(manifest!.keys).toContain('X');
  });
});

describe('checkFrozenKeys', () => {
  it('returns empty array when all frozen keys are present', () => {
    const dir = makeTmpDir();
    const file = writeEnv(dir, 'FOO=1\nBAR=2\n');
    freezeEnvFile(file, dir);
    const missing = checkFrozenKeys(file, dir);
    expect(missing).toHaveLength(0);
  });

  it('returns missing keys when env file has fewer keys', () => {
    const dir = makeTmpDir();
    const file = writeEnv(dir, 'FOO=1\nBAR=2\nBAZ=3\n');
    freezeEnvFile(file, dir);
    fs.writeFileSync(file, 'FOO=1\n');
    const missing = checkFrozenKeys(file, dir);
    expect(missing).toContain('BAR');
    expect(missing).toContain('BAZ');
  });
});

describe('formatFreezeResult', () => {
  it('includes key count and checksum', () => {
    const dir = makeTmpDir();
    const file = writeEnv(dir, 'A=1\nB=2\n');
    const manifest = freezeEnvFile(file, dir);
    const result = formatFreezeResult(manifest);
    expect(result).toContain('Keys frozen: 2');
    expect(result).toContain(manifest.checksum);
  });
});
