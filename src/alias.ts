import * as fs from 'fs';
import * as path from 'path';

export interface AliasMap {
  [alias: string]: string;
}

const ALIAS_FILE = '.envault-aliases.json';

export function getAliasFilePath(dir: string = process.cwd()): string {
  return path.join(dir, ALIAS_FILE);
}

export function loadAliases(dir?: string): AliasMap {
  const filePath = getAliasFilePath(dir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

export function saveAliases(aliases: AliasMap, dir?: string): void {
  const filePath = getAliasFilePath(dir);
  fs.writeFileSync(filePath, JSON.stringify(aliases, null, 2));
}

export function addAlias(name: string, target: string, dir?: string): AliasMap {
  const aliases = loadAliases(dir);
  aliases[name] = target;
  saveAliases(aliases, dir);
  return aliases;
}

export function removeAlias(name: string, dir?: string): AliasMap {
  const aliases = loadAliases(dir);
  if (!(name in aliases)) throw new Error(`Alias '${name}' not found`);
  delete aliases[name];
  saveAliases(aliases, dir);
  return aliases;
}

export function resolveAlias(name: string, dir?: string): string | undefined {
  const aliases = loadAliases(dir);
  return aliases[name];
}

/**
 * Resolves an alias chain, following aliases that point to other aliases.
 * Throws if a cycle is detected.
 */
export function resolveAliasChain(name: string, dir?: string): string {
  const aliases = loadAliases(dir);
  const visited = new Set<string>();
  let current = name;
  while (current in aliases) {
    if (visited.has(current)) {
      throw new Error(`Alias cycle detected involving '${current}'`);
    }
    visited.add(current);
    current = aliases[current];
  }
  if (current === name && !(name in aliases)) {
    throw new Error(`Alias '${name}' not found`);
  }
  return current;
}

export function formatAliases(aliases: AliasMap): string {
  const entries = Object.entries(aliases);
  if (entries.length === 0) return 'No aliases defined.';
  return entries.map(([k, v]) => `  ${k} -> ${v}`).join('\n');
}
