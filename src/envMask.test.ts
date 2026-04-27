import { maskValue, isSensitiveKey, maskEnvEntries, maskEnvContent, formatMaskedOutput } from './envMask';

describe('maskValue', () => {
  it('masks all but last 4 chars', () => {
    expect(maskValue('supersecret123')).toBe('**********t123');
  });

  it('masks entire value if shorter than visibleChars', () => {
    expect(maskValue('abc', '*', 4)).toBe('***');
  });

  it('uses custom mask char', () => {
    expect(maskValue('hello', '#', 2)).toBe('###lo');
  });

  it('respects custom visibleChars', () => {
    expect(maskValue('abcdefgh', '*', 2)).toBe('******gh');
  });
});

describe('isSensitiveKey', () => {
  it('detects password keys', () => {
    expect(isSensitiveKey('DB_PASSWORD')).toBe(true);
  });

  it('detects token keys', () => {
    expect(isSensitiveKey('GITHUB_TOKEN')).toBe(true);
  });

  it('detects api_key keys', () => {
    expect(isSensitiveKey('STRIPE_API_KEY')).toBe(true);
  });

  it('does not flag non-sensitive keys', () => {
    expect(isSensitiveKey('APP_NAME')).toBe(false);
    expect(isSensitiveKey('PORT')).toBe(false);
  });

  it('respects custom keys list', () => {
    expect(isSensitiveKey('MY_CUSTOM', { keys: ['MY_CUSTOM'] })).toBe(true);
  });

  it('respects custom pattern', () => {
    expect(isSensitiveKey('INTERNAL_VAR', { pattern: /internal/i })).toBe(true);
  });
});

describe('maskEnvEntries', () => {
  it('masks sensitive keys and leaves others intact', () => {
    const entries = { APP_NAME: 'myapp', DB_PASSWORD: 'secret123', PORT: '3000' };
    const result = maskEnvEntries(entries);
    expect(result['APP_NAME']).toBe('myapp');
    expect(result['PORT']).toBe('3000');
    expect(result['DB_PASSWORD']).not.toBe('secret123');
    expect(result['DB_PASSWORD']).toMatch(/\*+\d{3}/);
  });
});

describe('maskEnvContent', () => {
  it('masks content string', () => {
    const content = 'APP_NAME=myapp\nAPI_KEY=abc123xyz\n';
    const result = maskEnvContent(content);
    expect(result).toContain('APP_NAME=myapp');
    expect(result).not.toContain('API_KEY=abc123xyz');
    expect(result).toContain('API_KEY=');
  });
});

describe('formatMaskedOutput', () => {
  it('formats entries as KEY=VALUE lines', () => {
    const entries = { FOO: 'bar', BAZ: 'qux' };
    const output = formatMaskedOutput(entries);
    expect(output).toContain('FOO=bar');
    expect(output).toContain('BAZ=qux');
  });
});
