import fs from 'fs';
import os from 'os';
import path from 'path';
import { addSnippet, removeSnippet, getSnippet, listSnippets, formatSnippets } from './snippet';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snippet-'));
}

describe('snippet', () => {
  let dir: string;
  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  test('addSnippet stores a snippet', () => {
    const s = addSnippet(dir, 'db', 'DB_URL=postgres://localhost/dev', 'database url');
    expect(s.name).toBe('db');
    expect(s.content).toBe('DB_URL=postgres://localhost/dev');
    expect(s.description).toBe('database url');
    expect(s.createdAt).toBeTruthy();
  });

  test('getSnippet retrieves stored snippet', () => {
    addSnippet(dir, 'redis', 'REDIS_URL=redis://localhost');
    const s = getSnippet(dir, 'redis');
    expect(s?.content).toBe('REDIS_URL=redis://localhost');
  });

  test('getSnippet returns undefined for missing', () => {
    expect(getSnippet(dir, 'nope')).toBeUndefined();
  });

  test('removeSnippet removes existing snippet', () => {
    addSnippet(dir, 'tmp', 'TMP=1');
    expect(removeSnippet(dir, 'tmp')).toBe(true);
    expect(getSnippet(dir, 'tmp')).toBeUndefined();
  });

  test('removeSnippet returns false for missing snippet', () => {
    expect(removeSnippet(dir, 'ghost')).toBe(false);
  });

  test('listSnippets returns all snippets', () => {
    addSnippet(dir, 'a', 'A=1');
    addSnippet(dir, 'b', 'B=2');
    expect(listSnippets(dir)).toHaveLength(2);
  });

  test('formatSnippets shows no snippets message', () => {
    expect(formatSnippets([])).toBe('No snippets saved.');
  });

  test('formatSnippets lists snippet names', () => {
    addSnippet(dir, 'auth', 'AUTH_SECRET=x', 'auth keys');
    const out = formatSnippets(listSnippets(dir));
    expect(out).toContain('auth');
    expect(out).toContain('auth keys');
  });
});
