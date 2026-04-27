import { Command } from 'commander';
import * as path from 'path';
import {
  freezeEnvFile,
  loadFreezeManifest,
  checkFrozenKeys,
  formatFreezeResult,
} from './envFreeze';

export function registerEnvFreezeCommands(program: Command): void {
  const freeze = program.command('freeze').description('Freeze and protect env key sets');

  freeze
    .command('set [file]')
    .description('Freeze the current keys in an env file')
    .action((file = '.env') => {
      const dir = process.cwd();
      const filePath = path.resolve(dir, file);
      try {
        const manifest = freezeEnvFile(filePath, dir);
        console.log('Env file frozen successfully.');
        console.log(formatFreezeResult(manifest));
      } catch (e: any) {
        console.error(`Error freezing file: ${e.message}`);
        process.exit(1);
      }
    });

  freeze
    .command('status [file]')
    .description('Check if any frozen keys are missing from the env file')
    .action((file = '.env') => {
      const dir = process.cwd();
      const filePath = path.resolve(dir, file);
      const manifest = loadFreezeManifest(dir);
      if (!manifest) {
        console.log('No freeze manifest found. Run `freeze set` first.');
        return;
      }
      const missing = checkFrozenKeys(filePath, dir);
      if (missing.length === 0) {
        console.log('All frozen keys are present.');
      } else {
        console.warn(`Missing frozen keys (${missing.length}):`);
        missing.forEach(k => console.warn(`  - ${k}`));
        process.exit(1);
      }
    });

  freeze
    .command('show')
    .description('Show the current freeze manifest')
    .action(() => {
      const dir = process.cwd();
      const manifest = loadFreezeManifest(dir);
      if (!manifest) {
        console.log('No freeze manifest found.');
        return;
      }
      console.log(formatFreezeResult(manifest));
      console.log('Keys:');
      manifest.keys.forEach(k => console.log(`  ${k}`));
    });
}
