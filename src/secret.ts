import * as fs from 'fs';
import * as path from 'path';

export interface SecretEntry {
  key: string;
  description?: string;
  required: boolean;
  lastUpdated: string;
}

export interface SecretsManifest {
  version: number;
  secrets: SecretEntry[];
}

const MANIFEST_FILE = '.envault-secrets.json';

export function getManifestPath(dir: string = process.cwd()): string {
  return path.join(dir, MANIFEST_FILE);
}

export function loadManifest(dir?: string): SecretsManifest {
  const p = getManifestPath(dir);
  if (!fs.existsSync(p)) return { version: 1, secrets: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveManifest(manifest: SecretsManifest, dir?: string): void {
  fs.writeFileSync(getManifestPath(dir), JSON.stringify(manifest, null, 2));
}

export function addSecret(key: string, opts: { description?: string; required?: boolean }, dir?: string): SecretsManifest {
  const manifest = loadManifest(dir);
  const existing = manifest.secrets.findIndex(s => s.key === key);
  const entry: SecretEntry = {
    key,
    description: opts.description,
    required: opts.required ?? true,
    lastUpdated: new Date().toISOString(),
  };
  if (existing >= 0) manifest.secrets[existing] = entry;
  else manifest.secrets.push(entry);
  saveManifest(manifest, dir);
  return manifest;
}

export function removeSecret(key: string, dir?: string): SecretsManifest {
  const manifest = loadManifest(dir);
  manifest.secrets = manifest.secrets.filter(s => s.key !== key);
  saveManifest(manifest, dir);
  return manifest;
}

export function checkMissingSecrets(envKeys: string[], dir?: string): string[] {
  const manifest = loadManifest(dir);
  return manifest.secrets
    .filter(s => s.required && !envKeys.includes(s.key))
    .map(s => s.key);
}

export function formatManifest(manifest: SecretsManifest): string {
  if (manifest.secrets.length === 0) return 'No secrets registered.';
  return manifest.secrets
    .map(s => `${s.required ? '[required]' : '[optional]'} ${s.key}${s.description ? ` — ${s.description}` : ''}`)
    .join('\n');
}
