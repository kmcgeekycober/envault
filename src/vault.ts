import * as fs from 'fs';
import * as path from 'path';
import { encryptFile, decryptFile } from './gpg';

export interface VaultConfig {
  recipients: string[];
  envFile: string;
  encryptedFile: string;
}

const DEFAULT_CONFIG: VaultConfig = {
  recipients: [],
  envFile: '.env',
  encryptedFile: '.env.vault',
};

export function loadConfig(configPath = '.envault.json'): VaultConfig {
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    throw new Error(`Failed to parse config at ${configPath}`);
  }
}

export function saveConfig(config: VaultConfig, configPath = '.envault.json'): void {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export async function lockVault(config: VaultConfig): Promise<void> {
  const { recipients, envFile, encryptedFile } = config;
  if (!fs.existsSync(envFile)) {
    throw new Error(`Env file not found: ${envFile}`);
  }
  if (recipients.length === 0) {
    throw new Error('No recipients configured. Add GPG key fingerprints to .envault.json');
  }
  await encryptFile(envFile, encryptedFile, recipients);
}

export async function unlockVault(config: VaultConfig): Promise<void> {
  const { encryptedFile, envFile } = config;
  if (!fs.existsSync(encryptedFile)) {
    throw new Error(`Encrypted vault not found: ${encryptedFile}`);
  }
  await decryptFile(encryptedFile, envFile);
}

export function addRecipient(config: VaultConfig, fingerprint: string): VaultConfig {
  const normalized = fingerprint.replace(/\s/g, '').toUpperCase();
  if (config.recipients.includes(normalized)) {
    throw new Error(`Recipient ${normalized} is already in the config`);
  }
  return { ...config, recipients: [...config.recipients, normalized] };
}

export function removeRecipient(config: VaultConfig, fingerprint: string): VaultConfig {
  const normalized = fingerprint.replace(/\s/g, '').toUpperCase();
  const recipients = config.recipients.filter((r) => r !== normalized);
  if (recipients.length === config.recipients.length) {
    throw new Error(`Recipient ${normalized} not found in config`);
  }
  return { ...config, recipients };
}
