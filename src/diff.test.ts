import * as fs from 'fs';
import { parseEnvFile, diffEnvFiles, formatDiff } from './diff';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

function mockFile(path: string, content: string) {
  mockedFs.existsSync.mockImplementation((p) => p === path || true);
  mockedFs.readFileSync.mockImplementation((p: any) => {
    if (p === path) return content;
    return '';
  });
}

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('FOO=bar\nBAZ=qux\n');
    const map = parseEnvFile('.env');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comments and blank lines', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('# comment\n\nFOO=bar\n');
    const map = parseEnvFile('.env');
    expect(map.size).toBe(1);
  });

  it('strips surrounding quotes from values', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('SECRET="my secret"\n');
    const map = parseEnvFile('.env');
    expect(map.get('SECRET')).toBe('my secret');
  });

  it('returns empty map if file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const map = parseEnvFile('.env');
    expect(map.size).toBe(0);
  });
});

describe('diffEnvFiles', () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(true);
  });

  it('detects added keys', () => {
    mockedFs.readFileSync
      .mockReturnValueOnce('FOO=bar\n')
      .mockReturnValueOnce('FOO=bar\nNEW=val\n');
    const diff = diffEnvFiles('old.env', 'new.env');
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].key).toBe('NEW');
  });

  it('detects removed keys', () => {
    mockedFs.readFileSync
      .mockReturnValueOnce('FOO=bar\nOLD=val\n')
      .mockReturnValueOnce('FOO=bar\n');
    const diff = diffEnvFiles('old.env', 'new.env');
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].key).toBe('OLD');
  });

  it('detects changed values', () => {
    mockedFs.readFileSync
      .mockReturnValueOnce('FOO=old\n')
      .mockReturnValueOnce('FOO=new\n');
    const diff = diffEnvFiles('old.env', 'new.env');
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].oldValue).toBe('old');
    expect(diff.changed[0].newValue).toBe('new');
  });
});

describe('formatDiff', () => {
  it('masks values by default', () => {
    const diff = { added: [{ key: 'A', value: 'secret' }], removed: [], changed: [] };
    expect(formatDiff(diff)).toContain('***');
    expect(formatDiff(diff)).not.toContain('secret');
  });

  it('shows values when masking disabled', () => {
    const diff = { added: [{ key: 'A', value: 'secret' }], removed: [], changed: [] };
    expect(formatDiff(diff, false)).toContain('secret');
  });

  it('returns no changes message for empty diff', () => {
    expect(formatDiff({ added: [], removed: [], changed: [] })).toBe('(no changes)');
  });
});
