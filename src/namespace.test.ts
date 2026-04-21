import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadNamespaces,
  addNamespace,
  removeNamespace,
  setActiveNamespace,
  resolveNamespaceFile,
  formatNamespaces,
} from './namespace';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ns-'));
}

describe('namespace', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('loadNamespaces returns empty config when no file exists', () => {
    const config = loadNamespaces(tmpDir);
    expect(config).toEqual({ namespaces: {} });
  });

  test('addNamespace persists a namespace entry', () => {
    addNamespace('production', '.env.production', tmpDir);
    const config = loadNamespaces(tmpDir);
    expect(config.namespaces['production']).toBe('.env.production');
  });

  test('removeNamespace deletes an existing namespace', () => {
    addNamespace('staging', '.env.staging', tmpDir);
    removeNamespace('staging', tmpDir);
    const config = loadNamespaces(tmpDir);
    expect(config.namespaces['staging']).toBeUndefined();
  });

  test('removeNamespace throws on unknown namespace', () => {
    expect(() => removeNamespace('unknown', tmpDir)).toThrow('not found');
  });

  test('setActiveNamespace updates active field', () => {
    addNamespace('dev', '.env.dev', tmpDir);
    setActiveNamespace('dev', tmpDir);
    const config = loadNamespaces(tmpDir);
    expect(config.active).toBe('dev');
  });

  test('removeNamespace clears active if removed namespace was active', () => {
    addNamespace('dev', '.env.dev', tmpDir);
    setActiveNamespace('dev', tmpDir);
    removeNamespace('dev', tmpDir);
    const config = loadNamespaces(tmpDir);
    expect(config.active).toBeUndefined();
  });

  test('resolveNamespaceFile returns env file path', () => {
    addNamespace('prod', '.env.prod', tmpDir);
    expect(resolveNamespaceFile('prod', tmpDir)).toBe('.env.prod');
  });

  test('formatNamespaces shows active marker', () => {
    addNamespace('dev', '.env.dev', tmpDir);
    setActiveNamespace('dev', tmpDir);
    const config = loadNamespaces(tmpDir);
    const output = formatNamespaces(config);
    expect(output).toContain('(active)');
    expect(output).toContain('.env.dev');
  });

  test('formatNamespaces returns message when empty', () => {
    const config = loadNamespaces(tmpDir);
    expect(formatNamespaces(config)).toBe('No namespaces defined.');
  });
});
