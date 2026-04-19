import * as fs from 'fs';
import * as path from 'path';

export interface Tag {
  name: string;
  files: string[];
  createdAt: string;
}

export interface TagStore {
  tags: Tag[];
}

const TAG_FILE = '.envault/tags.json';

export function loadTags(dir: string = '.'): TagStore {
  const filePath = path.join(dir, TAG_FILE);
  if (!fs.existsSync(filePath)) return { tags: [] };
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function saveTags(store: TagStore, dir: string = '.'): void {
  const filePath = path.join(dir, TAG_FILE);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

export function addTag(name: string, files: string[], dir: string = '.'): Tag {
  const store = loadTags(dir);
  const existing = store.tags.findIndex(t => t.name === name);
  const tag: Tag = { name, files, createdAt: new Date().toISOString() };
  if (existing >= 0) store.tags[existing] = tag;
  else store.tags.push(tag);
  saveTags(store, dir);
  return tag;
}

export function removeTag(name: string, dir: string = '.'): boolean {
  const store = loadTags(dir);
  const before = store.tags.length;
  store.tags = store.tags.filter(t => t.name !== name);
  saveTags(store, dir);
  return store.tags.length < before;
}

export function getTag(name: string, dir: string = '.'): Tag | undefined {
  return loadTags(dir).tags.find(t => t.name === name);
}

export function formatTags(store: TagStore): string {
  if (store.tags.length === 0) return 'No tags defined.';
  return store.tags
    .map(t => `[${t.name}] files: ${t.files.join(', ')} (created: ${t.createdAt})`)
    .join('\n');
}
