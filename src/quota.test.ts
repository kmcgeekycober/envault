import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadQuotaConfig,
  saveQuotaConfig,
  checkEnvQuota,
  formatQuotaResult,
} from './quota';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-quota-'));
}

describe('quota', () => {
  it('loads defaults when no config file exists', () => {
    const dir = makeTmpDir();
    const cfg = loadQuotaConfig(dir);
    expect(cfg.maxKeys).toBe(100);
    expect(cfg.maxRecipients).toBe(20);
  });

  it('saves and reloads config', () => {
    const dir = makeTmpDir();
    saveQuotaConfig(dir, { maxKeys: 50, maxFileSizeBytes: 512, maxRecipients: 5 });
    const cfg = loadQuotaConfig(dir);
    expect(cfg.maxKeys).toBe(50);
    expect(cfg.maxRecipients).toBe(5);
  });

  it('passes quota for valid file', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar\nBAZ=qux\n');
    const result = checkEnvQuota(envFile, ['alice', 'bob'], { maxKeys: 10, maxFileSizeBytes: 1000, maxRecipients: 5 });
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects too many keys', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    const lines = Array.from({ length: 5 }, (_, i) => `KEY${i}=val`).join('\n');
    fs.writeFileSync(envFile, lines);
    const result = checkEnvQuota(envFile, [], { maxKeys: 3, maxFileSizeBytes: 10000, maxRecipients: 5 });
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes('Key count'))).toBe(true);
  });

  it('detects too many recipients', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'A=1\n');
    const recipients = ['a', 'b', 'c', 'd'];
    const result = checkEnvQuota(envFile, recipients, { maxKeys: 100, maxFileSizeBytes: 10000, maxRecipients: 2 });
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes('Recipient count'))).toBe(true);
  });

  it('formats passing result', () => {
    expect(formatQuotaResult({ passed: true, violations: [] })).toContain('passed');
  });

  it('formats failing result', () => {
    const out = formatQuotaResult({ passed: false, violations: ['Too many keys'] });
    expect(out).toContain('failed');
    expect(out).toContain('Too many keys');
  });
});
