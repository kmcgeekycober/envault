import * as fs from "fs";
import * as path from "path";

export interface EnvGroup {
  name: string;
  keys: string[];
  description?: string;
}

export interface EnvGroupConfig {
  groups: EnvGroup[];
}

export function getGroupsPath(dir: string = process.cwd()): string {
  return path.join(dir, ".envault", "groups.json");
}

export function loadGroups(dir?: string): EnvGroupConfig {
  const filePath = getGroupsPath(dir);
  if (!fs.existsSync(filePath)) {
    return { groups: [] };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as EnvGroupConfig;
}

export function saveGroups(config: EnvGroupConfig, dir?: string): void {
  const filePath = getGroupsPath(dir);
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}

export function addGroup(name: string, keys: string[], description?: string, dir?: string): EnvGroup {
  const config = loadGroups(dir);
  const existing = config.groups.find((g) => g.name === name);
  if (existing) {
    existing.keys = Array.from(new Set([...existing.keys, ...keys]));
    if (description !== undefined) existing.description = description;
    saveGroups(config, dir);
    return existing;
  }
  const group: EnvGroup = { name, keys, description };
  config.groups.push(group);
  saveGroups(config, dir);
  return group;
}

export function removeGroup(name: string, dir?: string): boolean {
  const config = loadGroups(dir);
  const before = config.groups.length;
  config.groups = config.groups.filter((g) => g.name !== name);
  if (config.groups.length === before) return false;
  saveGroups(config, dir);
  return true;
}

export function getGroup(name: string, dir?: string): EnvGroup | undefined {
  const config = loadGroups(dir);
  return config.groups.find((g) => g.name === name);
}

export function listGroups(dir?: string): EnvGroup[] {
  return loadGroups(dir).groups;
}

export function formatGroups(groups: EnvGroup[]): string {
  if (groups.length === 0) return "No groups defined.";
  return groups
    .map((g) => {
      const desc = g.description ? ` — ${g.description}` : "";
      return `[${g.name}]${desc}\n  keys: ${g.keys.join(", ")}`;
    })
    .join("\n");
}
