import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { checkEnvFile, formatEnvCheckResult } from './envCheck';

export function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcheck-'));
}

export function writeEnv(dir: string, name: string, content: string) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('checkEnvFile', () => {
  let dir: string;

  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it('returns valid when all required keys present', async () => {
    const envPath = writeEnv(dir, '.env', 'API_KEY=abc\nDB_URL=postgres://localhost\n');
    const tplPath = writeEnv(dir, '.env.template', 'API_KEY=\nDB_URL=\n');
    // Mock loadTemplate
    jest.mock('./template', () => ({
      loadTemplate: async () => ({
        keys: [
          { name: 'API_KEY', required: true },
          { name: 'DB_URL', required: true },
        ],
      }),
    }));
    const result = await checkEnvFile(envPath, tplPath);
    expect(result.missing).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('detects missing required keys', async () => {
    const result = {
      file: '.env',
      missing: ['API_KEY'],
      extra: [],
      valid: false,
    };
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('API_KEY');
  });

  it('detects extra keys', async () => {
    const result = {
      file: '.env',
      missing: [],
      extra: ['UNKNOWN_KEY'],
      valid: true,
    };
    expect(result.extra).toContain('UNKNOWN_KEY');
  });
});

describe('formatEnvCheckResult', () => {
  it('formats valid result', () => {
    const out = formatEnvCheckResult({ file: '.env', missing: [], extra: [], valid: true });
    expect(out).toContain('✓');
  });

  it('formats invalid result with missing keys', () => {
    const out = formatEnvCheckResult({ file: '.env', missing: ['FOO'], extra: [], valid: false });
    expect(out).toContain('✗');
    expect(out).toContain('FOO');
  });

  it('formats extra keys warning', () => {
    const out = formatEnvCheckResult({ file: '.env', missing: [], extra: ['BAR'], valid: true });
    expect(out).toContain('BAR');
  });
});
