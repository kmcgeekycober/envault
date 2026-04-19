import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { checkEnvAgainstTemplate, formatEnvCheckResult } from './envCheck';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcheck-'));
}

describe('checkEnvAgainstTemplate', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  function writeEnv(name: string, content: string) {
    const p = path.join(tmpDir, name);
    fs.writeFileSync(p, content);
    return p;
  }

  it('returns ok when env matches template', async () => {
    const envFile = writeEnv('.env', 'FOO=bar\nBAR=baz\n');
    const tmplFile = writeEnv('.env.template', 'FOO=\nBAR=\n');
    const result = await checkEnvAgainstTemplate(envFile, tmplFile);
    expect(result.ok).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('reports missing keys', async () => {
    const envFile = writeEnv('.env', 'FOO=bar\n');
    const tmplFile = writeEnv('.env.template', 'FOO=\nBAR=\n');
    const result = await checkEnvAgainstTemplate(envFile, tmplFile);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain('BAR');
  });

  it('reports extra keys', async () => {
    const envFile = writeEnv('.env', 'FOO=bar\nEXTRA=1\n');
    const tmplFile = writeEnv('.env.template', 'FOO=\n');
    const result = await checkEnvAgainstTemplate(envFile, tmplFile);
    expect(result.extra).toContain('EXTRA');
  });

  it('throws if env file missing', async () => {
    const tmplFile = writeEnv('.env.template', 'FOO=\n');
    await expect(
      checkEnvAgainstTemplate(path.join(tmpDir, 'nope.env'), tmplFile)
    ).rejects.toThrow('not found');
  });
});

describe('formatEnvCheckResult', () => {
  it('shows success message when ok and no extras', () => {
    const out = formatEnvCheckResult({ file: '.env', missing: [], extra: [], ok: true });
    expect(out).toContain('✔');
  });

  it('shows missing keys', () => {
    const out = formatEnvCheckResult({ file: '.env', missing: ['SECRET'], extra: [], ok: false });
    expect(out).toContain('SECRET');
    expect(out).toContain('✖');
  });

  it('shows extra keys', () => {
    const out = formatEnvCheckResult({ file: '.env', missing: [], extra: ['DEBUG'], ok: true });
    expect(out).toContain('DEBUG');
    expect(out).toContain('⚠');
  });
});
