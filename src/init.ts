import * as fs from 'fs';
import * as path from 'path';
import { saveConfig } from './vault';

export interface InitOptions {
  envFile?: string;
  recipients?: string[];
}

export function isAlreadyInitialized(dir: string = process.cwd()): boolean {
  return fs.existsSync(path.join(dir, '.envault.json'));
}

export function createGitignoreEntry(dir: string = process.cwd()): void {
  const gitignorePath = path.join(dir, '.gitignore');
  const entry = '\n# envault\n*.env\n!*.env.enc\n';

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, entry.trimStart());
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  if (!content.includes('*.env.enc')) {
    fs.appendFileSync(gitignorePath, entry);
  }
}

export function initVault(options: InitOptions = {}, dir: string = process.cwd()): string {
  if (isAlreadyInitialized(dir)) {
    throw new Error('envault is already initialized in this directory');
  }

  const config = {
    envFile: options.envFile ?? '.env',
    recipients: options.recipients ?? [],
    createdAt: new Date().toISOString(),
  };

  saveConfig(config, dir);
  createGitignoreEntry(dir);

  return config.envFile;
}
