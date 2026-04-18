import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initVault, isAlreadyInitialized, createGitignoreEntry } from './init';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-init-'));
}

describe('isAlreadyInitialized', () => {
  it('returns false when .envault.json does not exist', () => {
    const dir = makeTmpDir();
    expect(isAlreadyInitialized(dir)).toBe(false);
  });

  it('returns true when .envault.json exists', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, '.envault.json'), '{}');
    expect(isAlreadyInitialized(dir)).toBe(true);
  });
});

describe('createGitignoreEntry', () => {
  it('creates .gitignore if missing', () => {
    const dir = makeTmpDir();
    createGitignoreEntry(dir);
    const content = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8');
    expect(content).toContain('*.env.enc');
  });

  it('appends to existing .gitignore', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n');
    createGitignoreEntry(dir);
    const content = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8');
    expect(content).toContain('node_modules');
    expect(content).toContain('*.env.enc');
  });

  it('does not duplicate entry', () => {
    const dir = makeTmpDir();
    createGitignoreEntry(dir);
    createGitignoreEntry(dir);
    const content = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8');
    expect(content.split('*.env.enc').length - 1).toBe(1);
  });
});

describe('initVault', () => {
  it('creates .envault.json with defaults', () => {
    const dir = makeTmpDir();
    const envFile = initVault({}, dir);
    expect(envFile).toBe('.env');
    expect(fs.existsSync(path.join(dir, '.envault.json'))).toBe(true);
  });

  it('respects custom envFile option', () => {
    const dir = makeTmpDir();
    const envFile = initVault({ envFile: '.env.production' }, dir);
    expect(envFile).toBe('.env.production');
  });

  it('throws if already initialized', () => {
    const dir = makeTmpDir();
    initVault({}, dir);
    expect(() => initVault({}, dir)).toThrow('already initialized');
  });
});
