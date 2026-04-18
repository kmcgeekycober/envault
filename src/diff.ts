import * as fs from 'fs';

export interface EnvEntry {
  key: string;
  value: string;
}

export interface EnvDiff {
  added: EnvEntry[];
  removed: EnvEntry[];
  changed: Array<{ key: string; oldValue: string; newValue: string }>;
}

export function parseEnvFile(filePath: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(filePath)) return map;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    map.set(key, value);
  }
  return map;
}

export function diffEnvFiles(oldFile: string, newFile: string): EnvDiff {
  const oldMap = parseEnvFile(oldFile);
  const newMap = parseEnvFile(newFile);
  const diff: EnvDiff = { added: [], removed: [], changed: [] };

  for (const [key, newValue] of newMap) {
    if (!oldMap.has(key)) {
      diff.added.push({ key, value: newValue });
    } else if (oldMap.get(key) !== newValue) {
      diff.changed.push({ key, oldValue: oldMap.get(key)!, newValue });
    }
  }

  for (const [key, oldValue] of oldMap) {
    if (!newMap.has(key)) {
      diff.removed.push({ key, value: oldValue });
    }
  }

  return diff;
}

export function formatDiff(diff: EnvDiff, maskValues: boolean = true): string {
  const lines: string[] = [];
  const mask = (v: string) => maskValues ? '***' : v;

  for (const { key, value } of diff.added) {
    lines.push(`+ ${key}=${mask(value)}`);
  }
  for (const { key, oldValue, newValue } of diff.changed) {
    lines.push(`~ ${key}: ${mask(oldValue)} → ${mask(newValue)}`);
  }
  for (const { key, value } of diff.removed) {
    lines.push(`- ${key}=${mask(value)}`);
  }

  return lines.length > 0 ? lines.join('\n') : '(no changes)';
}
