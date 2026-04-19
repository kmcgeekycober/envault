import * as fs from 'fs';

export interface EnvEntry {
  key: string;
  value: string;
}

export interface DiffResult {
  added: EnvEntry[];
  removed: EnvEntry[];
  changed: Array<{ key: string; oldValue: string; newValue: string }>;
}

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function diffEnvFiles(oldContent: string, newContent: string): DiffResult {
  const oldMap = parseEnvFile(oldContent);
  const newMap = parseEnvFile(newContent);
  const added: EnvEntry[] = [];
  const removed: EnvEntry[] = [];
  const changed: DiffResult['changed'] = [];

  for (const [key, newValue] of newMap) {
    if (!oldMap.has(key)) {
      added.push({ key, value: newValue });
    } else if (oldMap.get(key) !== newValue) {
      changed.push({ key, oldValue: oldMap.get(key)!, newValue });
    }
  }

  for (const [key, oldValue] of oldMap) {
    if (!newMap.has(key)) {
      removed.push({ key, value: oldValue });
    }
  }

  return { added, removed, changed };
}

export function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];
  for (const e of diff.added) lines.push(`+ ${e.key}=${e.value}`);
  for (const e of diff.removed) lines.push(`- ${e.key}=${e.value}`);
  for (const e of diff.changed) lines.push(`~ ${e.key}: ${e.oldValue} -> ${e.newValue}`);
  return lines.length ? lines.join('\n') : '(no changes)';
}

/**
 * Returns true if the diff contains no additions, removals, or changes.
 */
export function isDiffEmpty(diff: DiffResult): boolean {
  return diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0;
}
