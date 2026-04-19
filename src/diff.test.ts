import { parseEnvFile, diffEnvFiles, formatDiff } from './diff';

const mockFile = (content: string) => content;

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const map = parseEnvFile('FOO=bar\nBAZ=qux');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nKEY=val');
    expect(map.size).toBe(1);
    expect(map.get('KEY')).toBe('val');
  });

  it('handles values with equals signs', () => {
    const map = parseEnvFile('URL=http://x.com?a=1');
    expect(map.get('URL')).toBe('http://x.com?a=1');
  });
});

describe('diffEnvFiles', () => {
  it('detects added keys', () => {
    const diff = diffEnvFiles('A=1', 'A=1\nB=2');
    expect(diff.added).toEqual([{ key: 'B', value: '2' }]);
  });

  it('detects removed keys', () => {
    const diff = diffEnvFiles('A=1\nB=2', 'A=1');
    expect(diff.removed).toEqual([{ key: 'B', value: '2' }]);
  });

  it('detects changed keys', () => {
    const diff = diffEnvFiles('A=1', 'A=2');
    expect(diff.changed).toEqual([{ key: 'A', oldValue: '1', newValue: '2' }]);
  });

  it('returns empty diff for identical files', () => {
    const diff = diffEnvFiles('A=1', 'A=1');
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });
});

describe('formatDiff', () => {
  it('formats added, removed, changed', () => {
    const result = formatDiff({
      added: [{ key: 'B', value: '2' }],
      removed: [{ key: 'C', value: '3' }],
      changed: [{ key: 'A', oldValue: '1', newValue: '9' }],
    });
    expect(result).toContain('+ B=2');
    expect(result).toContain('- C=3');
    expect(result).toContain('~ A: 1 -> 9');
  });

  it('returns no changes message for empty diff', () => {
    const result = formatDiff({ added: [], removed: [], changed: [] });
    expect(result).toBe('(no changes)');
  });
});
