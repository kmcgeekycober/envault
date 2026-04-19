import { Command } from 'commander';
import { addSecret, removeSecret, loadManifest, checkMissingSecrets, formatManifest } from './secret';
import { parseEnvFile } from './diff';
import * as fs from 'fs';

export function registerSecretCommands(program: Command): void {
  const secret = program.command('secret').description('Manage secrets manifest');

  secret
    .command('add <key>')
    .description('Register a secret key in the manifest')
    .option('-d, --description <desc>', 'Description of the secret')
    .option('--optional', 'Mark secret as optional', false)
    .action((key: string, opts) => {
      addSecret(key, { description: opts.description, required: !opts.optional });
      console.log(`Secret '${key}' added to manifest.`);
    });

  secret
    .command('remove <key>')
    .description('Remove a secret key from the manifest')
    .action((key: string) => {
      removeSecret(key);
      console.log(`Secret '${key}' removed from manifest.`);
    });

  secret
    .command('list')
    .description('List all registered secrets')
    .action(() => {
      const manifest = loadManifest();
      console.log(formatManifest(manifest));
    });

  secret
    .command('check <envFile>')
    .description('Check env file against secrets manifest for missing required keys')
    .action((envFile: string) => {
      const content = fs.readFileSync(envFile, 'utf8');
      const parsed = parseEnvFile(content);
      const missing = checkMissingSecrets(Object.keys(parsed));
      if (missing.length === 0) {
        console.log('All required secrets are present.');
      } else {
        console.error('Missing required secrets:');
        missing.forEach(k => console.error(`  - ${k}`));
        process.exit(1);
      }
    });
}
