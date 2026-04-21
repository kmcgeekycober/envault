import * as fs from "fs";
import * as path from "path";

export interface ScopeConfig {
  scopes: Record<string, string[]>; // scope name -> list of env keys
}

export function getScopePath(dir: string = process.cwd()): string {
  return path.join(dir, ".envault", "scopes.json");
}

export function loadScopes(dir?: string): ScopeConfig {
  const filePath = getScopePath(dir);
  if (!fs.existsSync(filePath)) {
    return { scopes: {} };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ScopeConfig;
}

export function saveScopes(config: ScopeConfig, dir?: string): void {
  const filePath = getScopePath(dir);
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}

export function addScope(name: string, keys: string[], dir?: string): ScopeConfig {
  const config = loadScopes(dir);
  config.scopes[name] = [...new Set([...(config.scopes[name] ?? []), ...keys])];
  saveScopes(config, dir);
  return config;
}

export function removeScope(name: string, dir?: string): ScopeConfig {
  const config = loadScopes(dir);
  if (!(name in config.scopes)) {
    throw new Error(`Scope "${name}" does not exist.`);
  }
  delete config.scopes[name];
  saveScopes(config, dir);
  return config;
}

export function getScope(name: string, dir?: string): string[] {
  const config = loadScopes(dir);
  if (!(name in config.scopes)) {
    throw new Error(`Scope "${name}" does not exist.`);
  }
  return config.scopes[name];
}

export function filterEnvByScope(
  env: Record<string, string>,
  scopeKeys: string[]
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter(([key]) => scopeKeys.includes(key))
  );
}

export function listScopes(dir?: string): string[] {
  const config = loadScopes(dir);
  return Object.keys(config.scopes);
}
