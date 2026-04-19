import fs from 'fs';
import path from 'path';

export type HookEvent = 'pre-encrypt' | 'post-encrypt' | 'pre-decrypt' | 'post-decrypt';

export interface Hook {
  event: HookEvent;
  command: string;
}

export interface HooksConfig {
  hooks: Hook[];
}

export function getHooksPath(dir: string = process.cwd()): string {
  return path.join(dir, '.envault-hooks.json');
}

export function loadHooks(dir?: string): HooksConfig {
  const p = getHooksPath(dir);
  if (!fs.existsSync(p)) return { hooks: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function saveHooks(config: HooksConfig, dir?: string): void {
  fs.writeFileSync(getHooksPath(dir), JSON.stringify(config, null, 2));
}

export function addHook(event: HookEvent, command: string, dir?: string): HooksConfig {
  const config = loadHooks(dir);
  config.hooks.push({ event, command });
  saveHooks(config, dir);
  return config;
}

export function removeHook(event: HookEvent, command: string, dir?: string): HooksConfig {
  const config = loadHooks(dir);
  config.hooks = config.hooks.filter(h => !(h.event === event && h.command === command));
  saveHooks(config, dir);
  return config;
}

export function getHooksForEvent(event: HookEvent, dir?: string): Hook[] {
  return loadHooks(dir).hooks.filter(h => h.event === event);
}

export function formatHooks(config: HooksConfig): string {
  if (config.hooks.length === 0) return 'No hooks configured.';
  return config.hooks.map(h => `[${h.event}] ${h.command}`).join('\n');
}
