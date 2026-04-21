import * as fs from 'fs';
import * as path from 'path';

export interface NamespaceConfig {
  namespaces: Record<string, string>; // name -> envFile path
  active?: string;
}

export function getNamespacePath(dir: string = process.cwd()): string {
  return path.join(dir, '.envault', 'namespaces.json');
}

export function loadNamespaces(dir?: string): NamespaceConfig {
  const filePath = getNamespacePath(dir);
  if (!fs.existsSync(filePath)) {
    return { namespaces: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as NamespaceConfig;
}

export function saveNamespaces(config: NamespaceConfig, dir?: string): void {
  const filePath = getNamespacePath(dir);
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

export function addNamespace(name: string, envFile: string, dir?: string): NamespaceConfig {
  const config = loadNamespaces(dir);
  config.namespaces[name] = envFile;
  saveNamespaces(config, dir);
  return config;
}

export function removeNamespace(name: string, dir?: string): NamespaceConfig {
  const config = loadNamespaces(dir);
  if (!config.namespaces[name]) {
    throw new Error(`Namespace "${name}" not found.`);
  }
  delete config.namespaces[name];
  if (config.active === name) {
    delete config.active;
  }
  saveNamespaces(config, dir);
  return config;
}

export function setActiveNamespace(name: string, dir?: string): NamespaceConfig {
  const config = loadNamespaces(dir);
  if (!config.namespaces[name]) {
    throw new Error(`Namespace "${name}" not found.`);
  }
  config.active = name;
  saveNamespaces(config, dir);
  return config;
}

export function resolveNamespaceFile(name: string, dir?: string): string {
  const config = loadNamespaces(dir);
  const envFile = config.namespaces[name];
  if (!envFile) {
    throw new Error(`Namespace "${name}" not found.`);
  }
  return envFile;
}

export function formatNamespaces(config: NamespaceConfig): string {
  const entries = Object.entries(config.namespaces);
  if (entries.length === 0) return 'No namespaces defined.';
  return entries
    .map(([name, file]) => {
      const active = config.active === name ? ' (active)' : '';
      return `  ${name}${active} -> ${file}`;
    })
    .join('\n');
}
