import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadHistory, saveHistory, addHistoryEntry, getFileHistory, formatHistory } from './history';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-history-'));
}

describe('history', () => {
  let tmp: string;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true }); });

  it('returns empty array when no history file', () => {
    expect(loadHistory(tmp)).toEqual([]);
  });

  it('saves and loads history', () => {
    const entries = [{ timestamp: '2024-01-01T00:00:00Z', file: '.env', action: 'encrypt' as const, user: 'alice', checksum: 'abc123' }];
    saveHistory(entries, tmp);
    expect(loadHistory(tmp)).toEqual(entries);
  });

  it('adds entry with timestamp', () => {
    addHistoryEntry({ file: '.env', action: 'decrypt', user: 'bob', checksum: 'def456' }, tmp);
    const history = loadHistory(tmp);
    expect(history).toHaveLength(1);
    expect(history[0].file).toBe('.env');
    expect(history[0].timestamp).toBeDefined();
  });

  it('filters by file', () => {
    addHistoryEntry({ file: '.env', action: 'encrypt', user: 'alice', checksum: 'aaa' }, tmp);
    addHistoryEntry({ file: '.env.prod', action: 'sync', user: 'bob', checksum: 'bbb' }, tmp);
    expect(getFileHistory('.env', tmp)).toHaveLength(1);
  });

  it('formats history entries', () => {
    const entries = [{ timestamp: '2024-01-01T00:00:00Z', file: '.env', action: 'encrypt' as const, user: 'alice', checksum: 'abc12345def' }];
    const out = formatHistory(entries);
    expect(out).toContain('ENCRYPT');
    expect(out).toContain('alice');
    expect(out).toContain('abc12345');
  });

  it('returns message when no entries', () => {
    expect(formatHistory([])).toBe('No history found.');
  });
});
