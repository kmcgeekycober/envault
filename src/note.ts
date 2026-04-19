import fs from 'fs';
import path from 'path';

export interface Note {
  id: string;
  file: string;
  text: string;
  author: string;
  createdAt: string;
}

export function getNotesPath(dir: string): string {
  return path.join(dir, '.envault', 'notes.json');
}

export function loadNotes(dir: string): Note[] {
  const p = getNotesPath(dir);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveNotes(dir: string, notes: Note[]): void {
  const p = getNotesPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(notes, null, 2));
}

export function addNote(dir: string, file: string, text: string, author: string): Note {
  const notes = loadNotes(dir);
  const note: Note = {
    id: Date.now().toString(36),
    file,
    text,
    author,
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  saveNotes(dir, notes);
  return note;
}

export function removeNote(dir: string, id: string): boolean {
  const notes = loadNotes(dir);
  const filtered = notes.filter(n => n.id !== id);
  if (filtered.length === notes.length) return false;
  saveNotes(dir, filtered);
  return true;
}

export function getNotesForFile(dir: string, file: string): Note[] {
  return loadNotes(dir).filter(n => n.file === file);
}

export function formatNotes(notes: Note[]): string {
  if (notes.length === 0) return 'No notes found.';
  return notes.map(n =>
    `[${n.id}] ${n.file} — ${n.author} at ${n.createdAt}\n  ${n.text}`
  ).join('\n');
}
