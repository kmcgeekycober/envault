import fs from 'fs';
import path from 'path';

export interface Snippet {
  name: string;
  description?: string;
  content: string;
  createdAt: string;
}

export interface SnippetStore {
  snippets: Record<string, Snippet>;
}

export function getSnippetsPath(dir: string): string {
  return path.join(dir, '.envault', 'snippets.json');
}

export function loadSnippets(dir: string): SnippetStore {
  const p = getSnippetsPath(dir);
  if (!fs.existsSync(p)) return { snippets: {} };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveSnippets(dir: string, store: SnippetStore): void {
  const p = getSnippetsPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2));
}

export function addSnippet(dir: string, name: string, content: string, description?: string): Snippet {
  const store = loadSnippets(dir);
  const snippet: Snippet = { name, content, description, createdAt: new Date().toISOString() };
  store.snippets[name] = snippet;
  saveSnippets(dir, store);
  return snippet;
}

export function removeSnippet(dir: string, name: string): boolean {
  const store = loadSnippets(dir);
  if (!store.snippets[name]) return false;
  delete store.snippets[name];
  saveSnippets(dir, store);
  return true;
}

export function getSnippet(dir: string, name: string): Snippet | undefined {
  return loadSnippets(dir).snippets[name];
}

export function listSnippets(dir: string): Snippet[] {
  return Object.values(loadSnippets(dir).snippets);
}

export function formatSnippets(snippets: Snippet[]): string {
  if (snippets.length === 0) return 'No snippets saved.';
  return snippets.map(s => `  ${s.name}${s.description ? ` — ${s.description}` : ''}`).join('\n');
}
