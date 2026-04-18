import { lintEnvContent, formatLintResults } from './lint';

describe('lintEnvContent', () => {
  it('returns no issues for valid env content', () => {
    const content = 'API_KEY=abc123\nDB_HOST=localhost\n';
    const result = lintEnvContent('.env', content);
    expect(result.issues).toHaveLength(0);
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nAPI_KEY=value\n';
    const result = lintEnvContent('.env', content);
    expect(result.issues).toHaveLength(0);
  });

  it('reports error for line missing =', () => {
    const result = lintEnvContent('.env', 'BADLINE\n');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('error');
    expect(result.issues[0].line).toBe(1);
  });

  it('warns for lowercase key', () => {
    const result = lintEnvContent('.env', 'api_key=value\n');
    const warn = result.issues.find(i => i.message.includes('uppercase'));
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warning');
  });

  it('warns for empty value', () => {
    const result = lintEnvContent('.env', 'API_KEY=\n');
    const warn = result.issues.find(i => i.message.includes('empty'));
    expect(warn).toBeDefined();
  });

  it('warns for unquoted value with spaces', () => {
    const result = lintEnvContent('.env', 'API_KEY=hello world\n');
    const warn = result.issues.find(i => i.message.includes('spaces'));
    expect(warn).toBeDefined();
  });

  it('does not warn for quoted value with spaces', () => {
    const result = lintEnvContent('.env', 'API_KEY="hello world"\n');
    const warn = result.issues.find(i => i.message.includes('spaces'));
    expect(warn).toBeUndefined();
  });
});

describe('formatLintResults', () => {
  it('shows no issues message when clean', () => {
    const output = formatLintResults([{ file: '.env', issues: [] }]);
    expect(output).toContain('no issues');
  });

  it('shows errors and warnings', () => {
    const output = formatLintResults([{
      file: '.env',
      issues: [
        { line: 1, message: 'Missing =', severity: 'error' },
        { line: 2, message: 'empty value', severity: 'warning' },
      ]
    }]);
    expect(output).toContain('[error]');
    expect(output).toContain('[warn]');
  });
});
