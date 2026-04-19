import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addAlias, removeAlias, loadAliases, resolveAlias, formatAliases } from './alias';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-alias-'));
}

describe('alias', () => {
  let tmp: string;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => fs.rmSync(tmp, { recursive: true }));

  it('loads empty aliases when file missing', () => {
    expect(loadAliases(tmp)).toEqual({});
  });

  it('adds and loads an alias', () => {
    addAlias('prod', '.env.production', tmp);
    expect(loadAliases(tmp)).toEqual({ prod: '.env.production' });
  });

  it('resolves an alias', () => {
    addAlias('staging', '.env.staging', tmp);
    expect(resolveAlias('staging', tmp)).toBe('.env.staging');
  });

  it('returns undefined for unknown alias', () => {
    expect(resolveAlias('nope', tmp)).toBeUndefined();
  });

  it('removes an alias', () => {
    addAlias('dev', '.env.dev', tmp);
    removeAlias('dev', tmp);
    expect(loadAliases(tmp)).toEqual({});
  });

  it('throws when removing non-existent alias', () => {
    expect(() => removeAlias('ghost', tmp)).toThrow("Alias 'ghost' not found");
  });

  it('formats aliases nicely', () => {
    addAlias('prod', '.env.production', tmp);
    const out = formatAliases(loadAliases(tmp));
    expect(out).toContain('prod -> .env.production');
  });

  it('formats empty aliases', () => {
    expect(formatAliases({})).toBe('No aliases defined.');
  });
});
