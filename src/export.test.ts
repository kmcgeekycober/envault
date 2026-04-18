import { parseDecryptedEnv, formatEnvJson, formatEnvShell, formatEnvDotenv } from './export';

describe('parseDecryptedEnv', () => {
  it('parses simple key=value pairs', () => {
    const result = parseDecryptedEnv('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const result = parseDecryptedEnv('# comment\n\nKEY=value');
    expect(result).toEqual({ KEY: 'value' });
  });

  it('handles values with = in them', () => {
    const result = parseDecryptedEnv('URL=http://x.com?a=1');
    expect(result).toEqual({ URL: 'http://x.com?a=1' });
  });
});

describe('formatEnvJson', () => {
  it('returns pretty JSON', () => {
    const out = formatEnvJson({ A: '1', B: '2' });
    expect(JSON.parse(out)).toEqual({ A: '1', B: '2' });
  });
});

describe('formatEnvShell', () => {
  it('prefixes each line with export', () => {
    const out = formatEnvShell({ FOO: 'bar' });
    expect(out).toContain('export FOO="bar"');
  });
});

describe('formatEnvDotenv', () => {
  it('returns KEY=value lines', () => {
    const out = formatEnvDotenv({ FOO: 'bar', BAZ: 'qux' });
    expect(out).toContain('FOO=bar');
    expect(out).toContain('BAZ=qux');
  });
});
