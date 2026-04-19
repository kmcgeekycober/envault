import * as fs from 'fs';
import * as path from 'path';

export interface PinEntry {
  file: string;
  label?: string;
  pinnedAt: string;
}

export interface PinStore {
  pins: PinEntry[];
}

export function getPinsPath(dir: string = process.cwd()): string {
  return path.join(dir, '.envault', 'pins.json');
}

export function loadPins(dir?: string): PinStore {
  const p = getPinsPath(dir);
  if (!fs.existsSync(p)) return { pins: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function savePins(store: PinStore, dir?: string): void {
  const p = getPinsPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2));
}

export function addPin(file: string, label: string | undefined, dir?: string): PinEntry {
  const store = loadPins(dir);
  const existing = store.pins.find(p => p.file === file);
  if (existing) {
    existing.label = label;
    existing.pinnedAt = new Date().toISOString();
    savePins(store, dir);
    return existing;
  }
  const entry: PinEntry = { file, label, pinnedAt: new Date().toISOString() };
  store.pins.push(entry);
  savePins(store, dir);
  return entry;
}

export function removePin(file: string, dir?: string): boolean {
  const store = loadPins(dir);
  const before = store.pins.length;
  store.pins = store.pins.filter(p => p.file !== file);
  if (store.pins.length === before) return false;
  savePins(store, dir);
  return true;
}

export function listPins(dir?: string): PinEntry[] {
  return loadPins(dir).pins;
}

export function formatPins(pins: PinEntry[]): string {
  if (pins.length === 0) return 'No pinned files.';
  return pins.map(p => `${p.file}${p.label ? ` (${p.label})` : ''} — pinned ${p.pinnedAt}`).join('\n');
}
