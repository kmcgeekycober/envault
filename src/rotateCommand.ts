import { Command } from 'commander';
import { rotateEncryption, rotateAll } from './rotate';

export function registerRotateCommands(program: Command): void {
  const rotate = program
    .command('rotate')
    .description('Re-encrypt .env files with the current recipient list');

  rotate
    .command('file <envFile>')
    .description('Rotate encryption for a specific .env file')
    .option('-c, --config <path>', 'Path to envault config', '.envault.json')
    .action(async (envFile: string, opts: { config: string }) => {
      try {
        const result = await rotateEncryption(envFile, opts.config);
        console.log(`✔ Rotated encryption for ${result.envFile}`);
        console.log(`  Encrypted: ${result.encryptedFile}`);
        console.log(`  Recipients (${result.recipients.length}): ${result.recipients.join(', ')}`);
      } catch (err: any) {
        console.error(`✖ Rotation failed: ${err.message}`);
        process.exit(1);
      }
    });

  rotate
    .command('all')
    .description('Rotate encryption for all configured .env files')
    .option('-c, --config <path>', 'Path to envault config', '.envault.json')
    .action(async (opts: { config: string }) => {
      try {
        const results = await rotateAll(opts.config);
        results.forEach(r => console.log(`✔ Rotated ${r.envFile} (${r.recipients.length} recipients)`));
      } catch (err: any) {
        console.error(`✖ Rotation failed: ${err.message}`);
        process.exit(1);
      }
    });
}
