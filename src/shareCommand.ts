import { Command } from 'commander';
import * as fs from 'fs';
import { shareEnvFile, shareWithAllRecipients, formatShareResults } from './share';

export function registerShareCommands(program: Command): void {
  const share = program
    .command('share')
    .description('Encrypt and share .env files with recipients');

  share
    .command('file <envFile>')
    .description('Share an env file with a specific recipient or all configured recipients')
    .option('-r, --recipient <email>', 'Recipient email address')
    .option('-o, --output-dir <dir>', 'Output directory for encrypted files', '.')
    .action(async (envFile: string, opts: { recipient?: string; outputDir: string }) => {
      if (!fs.existsSync(envFile)) {
        console.error(`Error: File not found: ${envFile}`);
        process.exit(1);
      }
      try {
        if (opts.recipient) {
          const result = await shareEnvFile(envFile, opts.recipient, opts.outputDir);
          if (result.success) {
            console.log(`✓ Shared with ${result.recipient} → ${result.outputPath}`);
          } else {
            console.error(`✗ Failed: ${result.error}`);
            process.exit(1);
          }
        } else {
          const results = await shareWithAllRecipients(envFile, opts.outputDir);
          console.log(formatShareResults(results));
          if (results.some(r => !r.success)) process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
