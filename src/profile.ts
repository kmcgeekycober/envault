import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './vault';

export interface Profile {
  name: string;
  file: string;
  description?: string;
}

export interface ProfileConfig {
  profiles: Record<string, Profile>;
  active?: string;
}

export function loadProfiles(vaultDir = '.envault'): ProfileConfig {
  const p = path.join(vaultDir, 'profiles.json');
  if (!fs.existsSync(p)) return { profiles: {} };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveProfiles(config: ProfileConfig, vaultDir = '.envault'): void {
  const p = path.join(vaultDir, 'profiles.json');
  fs.mkdirSync(vaultDir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2));
}

export function addProfile(name: string, file: string, description?: string, vaultDir = '.envault'): Profile {
  const config = loadProfiles(vaultDir);
  if (config.profiles[name]) throw new Error(`Profile '${name}' already exists`);
  const profile: Profile = { name, file, description };
  config.profiles[name] = profile;
  saveProfiles(config, vaultDir);
  return profile;
}

export function removeProfile(name: string, vaultDir = '.envault'): void {
  const config = loadProfiles(vaultDir);
  if (!config.profiles[name]) throw new Error(`Profile '${name}' not found`);
  if (config.active === name) config.active = undefined;
  delete config.profiles[name];
  saveProfiles(config, vaultDir);
}

export function setActiveProfile(name: string, vaultDir = '.envault'): void {
  const config = loadProfiles(vaultDir);
  if (!config.profiles[name]) throw new Error(`Profile '${name}' not found`);
  config.active = name;
  saveProfiles(config, vaultDir);
}

export function getActiveProfile(vaultDir = '.envault'): Profile | undefined {
  const config = loadProfiles(vaultDir);
  if (!config.active) return undefined;
  return config.profiles[config.active];
}

export function listProfiles(vaultDir = '.envault'): Profile[] {
  const config = loadProfiles(vaultDir);
  return Object.values(config.profiles);
}
