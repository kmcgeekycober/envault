import fs from 'fs';
import os from 'os';
import path from 'path';
import { addNote, removeNote, getNotesForFile, loadNotes, formatNotes } from './note';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-note-'));
}

describe('note', () => {
  let dir: string;
  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it('starts with no notes', () => {
    expect(loadNotes(dir)).toEqual([]);
  });

  it('adds a note', () => {
    const n = addNote(dir, '.env', 'remember to rotate', 'alice');
    expect(n.file).toBe('.env');
    expect(n.text).toBe('remember to rotate');
    expect(n.author).toBe('alice');
    expect(n.id).toBeTruthy();
  });

  it('persists notes', () => {
    addNote(dir, '.env', 'note1', 'alice');
    addNote(dir, '.env.prod', 'note2', 'bob');
    expect(loadNotes(dir)).toHaveLength(2);
  });

  it('removes a note by id', () => {
    const n = addNote(dir, '.env', 'to remove', 'alice');
    const result = removeNote(dir, n.id);
    expect(result).toBe(true);
    expect(loadNotes(dir)).toHaveLength(0);
  });

  it('returns false when removing non-existent id', () => {
    expect(removeNote(dir, 'nope')).toBe(false);
  });

  it('filters notes by file', () => {
    addNote(dir, '.env', 'a', 'alice');
    addNote(dir, '.env.prod', 'b', 'bob');
    const results = getNotesForFile(dir, '.env');
    expect(results).toHaveLength(1);
    expect(results[0].file).toBe('.env');
  });

  it('formats notes', () => {
    addNote(dir, '.env', 'hello', 'alice');
    const notes = loadNotes(dir);
    const out = formatNotes(notes);
    expect(out).toContain('hello');
    expect(out).toContain('alice');
  });

  it('formats empty notes', () => {
    expect(formatNotes([])).toBe('No notes found.');
  });
});
