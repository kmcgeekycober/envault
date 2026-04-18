import { Command } from 'commander';
import chalk from 'chalk';
import { pushEnv, pullEnv } from './sync';
import { diffEnvFiles, formatDiff } from './diff';
import * as fs from 'fs';

export function registerSyncCommands(program: Command): void {
  program
    .command('push [envFile]')
    .description('Encrypt and push .env file for team members')
    .option('--show-diff', 'Show diff of changes before pushing')
    .action(async (envFile: string = '.env', options: { showDiff?: boolean }) => {
      try {
        if (options.showDiff && fs.existsSync(envFile + '.gpg')) {
          const tmpDecrypted = envFile + '.prev';
          const { decryptFile } = await import('./gpg');
          await decryptFile(envFile + '.gpg', tmpDecrypted);
          const diff = diffEnvFiles(tmpDecrypted, envFile);
          console.log(chalk.bold('Changes to be pushed:'));
          console.log(formatDiff(diff));
          fs.unlinkSync(tmpDecrypted);
        }

        const result = await pushEnv(envFile);
        console.log(chalk.green(`✔ Pushed ${result.file} at ${new Date(result.timestamp).toISOString()}`));
      } catch (err: any) {
        console.error(chalk.red(`✘ Push failed: ${err.message}`));
        process.exit(1);
      }
    });

  program
    .command('pull [envFile]')
    .description('Decrypt and pull latest .env file')
    .option('--show-diff', 'Show diff after pulling')
    .action(async (envFile: string = '.env', options: { showDiff?: boolean }) => {
      try {
        const prevFile = envFile + '.bak';
        if (options.showDiff && fs.existsSync(envFile)) {
          fs.copyFileSync(envFile, prevFile);
        }

        const result = await pullEnv(envFile);

        if (result.status === 'up-to-date') {
          console.log(chalk.blue(`ℹ ${envFile} is already up-to-date`));
        } else {
          console.log(chalk.green(`✔ Pulled ${result.file} at ${new Date(result.timestamp).toISOString()}`));

          if (options.showDiff && fs.existsSync(prevFile)) {
            const diff = diffEnvFiles(prevFile, envFile);
            console.log(chalk.bold('Changes pulled:'));
            console.log(formatDiff(diff));
            fs.unlinkSync(prevFile);
          }
        }
      } catch (err: any) {
        console.error(chalk.red(`✘ Pull failed: ${err.message}`));
        process.exit(1);
      }
    });
}
