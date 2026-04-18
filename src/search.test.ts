import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { searchEnvKeys, formatSearchResults } from './search';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-search-'));
}

describe('searchEnvKeys', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true });
  });

  it('finds keys matching pattern', () => {
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=secret\n');
    const results = searchEnvKeys([file], 'DB_');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toEqual(expect.arrayContaining(['DB_HOST', 'DB_PORT']));
  });

  it('returns empty array for no matches', () => {
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=bar\n');
    expect(searchEnvKeys([file], 'MISSING')).toHaveLength(0);
  });

  it('searches values when valueSearch=true', () => {
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'HOST=localhost\nPORT=5432\n');
    const results = searchEnvKeys([file], 'localhost', true);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('HOST');
  });

  it('skips missing files', () => {
    const results = searchEnvKeys(['/nonexistent/.env'], 'KEY');
    expect(results).toHaveLength(0);
  });

  it('includes correct line numbers', () => {
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FIRST=1\nSECOND=2\nTHIRD=3\n');
    const results = searchEnvKeys([file], 'THIRD');
    expect(results[0].line).toBe(3);
  });
});

describe('formatSearchResults', () => {
  it('returns no matches message when empty', () => {
    expect(formatSearchResults([])).toBe('No matches found.');
  });

  it('formats results grouped by file', () => {
    const results = [
      { file: '.env', key: 'DB_HOST', value: 'localhost', line: 1 },
      { file: '.env', key: 'DB_PORT', value: '5432', line: 2 },
    ];
    const out = formatSearchResults(results);
    expect(out).toContain('.env');
    expect(out).toContain('DB_HOST');
    expect(out).not.toContain('localhost');
  });

  it('shows values when showValues=true', () => {
    const results = [{ file: '.env', key: 'API_KEY', value: 'secret', line: 1 }];
    const out = formatSearchResults(results, true);
    expect(out).toContain('=secret');
  });
});
