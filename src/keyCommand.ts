import { Command } from 'commander';
import { listPublicKeys } from './gpg';
import { loadConfig, addRecipient, removeRecipient } from './vault';

export function registerKeyCommands(program: Command): void {
  const key = program.command('key').description('Manage GPG recipients for the vault');

  key
    .command('list')
    .description('List all trusted recipients')
    .action(async () => {
      const config = await loadConfig();
      if (!config.recipients || config.recipients.length === 0) {
        console.log('No recipients configured.');
        return;
      }
      console.log('Recipients:');
      config.recipients.forEach((r: string) => console.log(`  ${r}`));
    });

  key
    .command('add <fingerprint>')
    .description('Add a GPG key fingerprint as a recipient')
    .action(async (fingerprint: string) => {
      const keys = await listPublicKeys();
      const match = keys.find((k) => k.fingerprint === fingerprint || k.keyId === fingerprint);
      if (!match) {
        console.error(`Key ${fingerprint} not found in local GPG keyring.`);
        process.exit(1);
      }
      await addRecipient(fingerprint);
      console.log(`Added recipient: ${fingerprint} (${match.uid})`);
    });

  key
    .command('remove <fingerprint>')
    .description('Remove a GPG key fingerprint from recipients')
    .action(async (fingerprint: string) => {
      await removeRecipient(fingerprint);
      console.log(`Removed recipient: ${fingerprint}`);
    });

  key
    .command('available')
    .description('List GPG public keys available in local keyring')
    .action(async () => {
      const keys = await listPublicKeys();
      if (keys.length === 0) {
        console.log('No public keys found in keyring.');
        return;
      }
      console.log('Available GPG keys:');
      keys.forEach((k) => console.log(`  [${k.keyId}] ${k.uid} — ${k.fingerprint}`));
    });
}
