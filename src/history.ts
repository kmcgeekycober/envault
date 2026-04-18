import * as fs from 'fs';
import * as path from 'path';

export interface HistoryEntry {
  timestamp: string;
  file: string;
  action: 'encrypt' | 'decrypt' | 'sync';
  user: string;
  checksum: string;
}

const HISTORY_FILE = '.envault/history.json';

export function loadHistory(dir: string = '.'): HistoryEntry[] {
  const filePath = path.join(dir, HISTORY_FILE);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[], dir: string = '.'): void {
  const filePath = path.join(dir, HISTORY_FILE);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'timestamp'>, dir: string = '.'): void {
  const entries = loadHistory(dir);
  entries.push({ ...entry, timestamp: new Date().toISOString() });
  saveHistory(entries, dir);
}

export function getFileHistory(file: string, dir: string = '.'): HistoryEntry[] {
  return loadHistory(dir).filter(e => e.file === file);
}

export function formatHistory(entries: HistoryEntry[]): string {
  if (entries.length === 0) return 'No history found.';
  return entries
    .map(e => `[${e.timestamp}] ${e.action.toUpperCase()} ${e.file} by ${e.user} (${e.checksum.slice(0, 8)})`)
    .join('\n');
}
