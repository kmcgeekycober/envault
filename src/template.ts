import * as fs from 'fs';
import * as path from 'path';

export interface EnvTemplate {
  keys: string[];
  required: string[];
  descriptions: Record<string, string>;
}

export function parseTemplate(content: string): EnvTemplate {
  const keys: string[] = [];
  const required: string[] = [];
  const descriptions: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#!')) continue;

    if (trimmed.startsWith('#')) {
      const last = keys[keys.length - 1];
      if (last) descriptions[last] = trimmed.slice(1).trim();
      continue;
    }

    const match = trimmed.match(/^([A-Z0-9_]+)(=?)(.*)$/);
    if (!match) continue;

    const [, key, eq, val] = match;
    keys.push(key);
    if (eq === '=' && val.trim() === '') required.push(key);
  }

  return { keys, required, descriptions };
}

export function validateEnvAgainstTemplate(
  env: Record<string, string>,
  template: EnvTemplate
): string[] {
  return template.required.filter((k) => !(k in env) || env[k] === '');
}

export function generateTemplateFromEnv(env: Record<string, string>): string {
  return Object.keys(env)
    .map((k) => `${k}=`)
    .join('\n') + '\n';
}

export function loadTemplate(filePath: string): EnvTemplate {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseTemplate(content);
}

export function saveTemplate(filePath: string, template: EnvTemplate): void {
  const lines: string[] = [];
  for (const key of template.keys) {
    if (template.descriptions[key]) lines.push(`# ${template.descriptions[key]}`);
    lines.push(`${key}=`);
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}
