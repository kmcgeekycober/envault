import { Command } from 'commander';
import * as path from 'path';
import { watchEnvFile } from './watch';

export function registerWatchCommands(program: Command): void {
  program
    .command('watch [envFile]')
    .description('Watch a .env file and auto-encrypt on change')
    .option('-d, --vault-dir <dir>', 'Vault directory', '.envault')
    .action(async (envFile: string = '.env', opts: { vaultDir: string }) => {
      const resolvedEnv = path.resolve(envFile);
      const resolvedVault = path.resolve(opts.vaultDir);

      console.log(`Watching ${resolvedEnv} for changes...`);

      await watchEnvFile({
        envFile: resolvedEnv,
        vaultDir: resolvedVault,
        onEncrypt: (out) => {
          console.log(`Encrypted → ${out}`);
        },
        onError: (err) => {
          console.error(`Error: ${err.message}`);
        },
      });

      // Keep process alive
      process.stdin.resume();
      process.on('SIGINT', () => {
        console.log('\nStopping watcher.');
        process.exit(0);
      });
    });
}
