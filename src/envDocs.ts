import * as fs from 'fs';
import * as path from 'path';

export interface EnvDocEntry {
  key: string;
  description: string;
  example?: string;
  required?: boolean;
}

export interface EnvDocs {
  [key: string]: EnvDocEntry;
}

export function getEnvDocsPath(dir: string = process.cwd()): string {
  return path.join(dir, '.envdocs.json');
}

export function loadEnvDocs(dir?: string): EnvDocs {
  const docsPath = getEnvDocsPath(dir);
  if (!fs.existsSync(docsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(docsPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveEnvDocs(docs: EnvDocs, dir?: string): void {
  const docsPath = getEnvDocsPath(dir);
  fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2));
}

export function addEnvDoc(key: string, entry: Omit<EnvDocEntry, 'key'>, dir?: string): EnvDocs {
  const docs = loadEnvDocs(dir);
  docs[key] = { key, ...entry };
  saveEnvDocs(docs, dir);
  return docs;
}

export function removeEnvDoc(key: string, dir?: string): EnvDocs {
  const docs = loadEnvDocs(dir);
  delete docs[key];
  saveEnvDocs(docs, dir);
  return docs;
}

export function getEnvDoc(key: string, dir?: string): EnvDocEntry | undefined {
  return loadEnvDocs(dir)[key];
}

export function formatEnvDocs(docs: EnvDocs): string {
  const entries = Object.values(docs);
  if (entries.length === 0) return 'No documentation entries found.';
  return entries
    .map(e => {
      const lines = [`${e.key}${e.required ? ' (required)' : ''}`];
      lines.push(`  Description: ${e.description}`);
      if (e.example) lines.push(`  Example: ${e.example}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function generateDocsFromEnv(envContent: string, dir?: string): EnvDocs {
  const docs = loadEnvDocs(dir);
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match && !docs[match[1]]) {
      docs[match[1]] = { key: match[1], description: '' };
    }
  }
  saveEnvDocs(docs, dir);
  return docs;
}
