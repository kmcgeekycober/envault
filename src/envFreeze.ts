import * as fs from 'fs';
import * as path from 'path';

export interface FreezeManifest {
  frozenAt: string;
  file: string;
  keys: string[];
  checksum: string;
}

export function getFreezePath(dir: string): string {
  return path.join(dir, '.envault', 'freeze.json');
}

export function loadFreezeManifest(dir: string): FreezeManifest | null {
  const p = getFreezePath(dir);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveFreezeManifest(dir: string, manifest: FreezeManifest): void {
  const p = getFreezePath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(manifest, null, 2));
}

export function computeChecksum(keys: string[]): string {
  const sorted = [...keys].sort().join(',');
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = (hash << 5) - hash + sorted.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function freezeEnvFile(filePath: string, dir: string): FreezeManifest {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = content
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim())
    .filter(Boolean);
  const manifest: FreezeManifest = {
    frozenAt: new Date().toISOString(),
    file: filePath,
    keys,
    checksum: computeChecksum(keys),
  };
  saveFreezeManifest(dir, manifest);
  return manifest;
}

export function checkFrozenKeys(filePath: string, dir: string): string[] {
  const manifest = loadFreezeManifest(dir);
  if (!manifest) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const currentKeys = content
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim())
    .filter(Boolean);
  return manifest.keys.filter(k => !currentKeys.includes(k));
}

export function formatFreezeResult(manifest: FreezeManifest): string {
  return [
    `Frozen at: ${manifest.frozenAt}`,
    `File: ${manifest.file}`,
    `Keys frozen: ${manifest.keys.length}`,
    `Checksum: ${manifest.checksum}`,
  ].join('\n');
}
