#!/usr/bin/env node
import { program } from 'commander';
import { loadConfig, saveConfig, addRecipient, removeRecipient } from './vault';
import { encryptFile, decryptFile, listPublicKeys } from './gpg';
import * as path from 'path';

const DEFAULT_ENV = '.env';
const DEFAULT_VAULT = '.env.vault';

program
  .name('envault')
  .description('Encrypt and sync .env files using GPG keys')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize envault in the current directory')
  .action(async () => {
    await saveConfig({ recipients: [], vaultFile: DEFAULT_VAULT });
    console.log('Initialized envault. Config saved to .envault.json');
  });

program
  .command('encrypt')
  .description('Encrypt the .env file into the vault')
  .option('-e, --env <file>', 'Path to .env file', DEFAULT_ENV)
  .option('-o, --output <file>', 'Output vault file', DEFAULT_VAULT)
  .action(async (opts) => {
    const config = await loadConfig();
    if (!config.recipients.length) {
      console.error('No recipients configured. Add recipients with: envault add-recipient <keyId>');
      process.exit(1);
    }
    await encryptFile(path.resolve(opts.env), path.resolve(opts.output), config.recipients);
    console.log(`Encrypted ${opts.env} -> ${opts.output}`);
  });

program
  .command('decrypt')
  .description('Decrypt the vault file into .env')
  .option('-v, --vault <file>', 'Path to vault file', DEFAULT_VAULT)
  .option('-o, --output <file>', 'Output .env file', DEFAULT_ENV)
  .action(async (opts) => {
    await decryptFile(path.resolve(opts.vault), path.resolve(opts.output));
    console.log(`Decrypted ${opts.vault} -> ${opts.output}`);
  });

program
  .command('add-recipient <keyId>')
  .description('Add a GPG key recipient')
  .action(async (keyId: string) => {
    await addRecipient(keyId);
    console.log(`Added recipient: ${keyId}`);
  });

program
  .command('remove-recipient <keyId>')
  .description('Remove a GPG key recipient')
  .action(async (keyId: string) => {
    await removeRecipient(keyId);
    console.log(`Removed recipient: ${keyId}`);
  });

program
  .command('list-keys')
  .description('List available public GPG keys')
  .action(async () => {
    const keys = await listPublicKeys();
    if (!keys.length) {
      console.log('No public keys found.');
    } else {
      keys.forEach((k) => console.log(`  ${k}`));
    }
  });

program.parse(process.argv);
