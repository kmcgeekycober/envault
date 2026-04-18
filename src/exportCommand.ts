import { Command } from 'commander';
import { getEncryptedFilePath } from './sync';
import { exportVault, ExportFormat } from './export';

export function registerExportCommands(program: Command): void {
  program
    .command('export')
    .description('Decrypt and export vault to stdout or a file')
    .option('-e, --env <env>', 'Environment name', 'default')
    .option('-f, --format <format>', 'Output format: dotenv | json | shell', 'dotenv')
    .option('-o, --output <file>', 'Write output to file instead of stdout')
    .action(async (opts) => {
      const format = opts.format as ExportFormat;
      const validFormats: ExportFormat[] = ['dotenv', 'json', 'shell'];
      if (!validFormats.includes(format)) {
        console.error(`Invalid format "${format}". Choose from: ${validFormats.join(', ')}`);
        process.exit(1);
      }

      const encryptedFile = getEncryptedFilePath(opts.env);
      try {
        const output = await exportVault(encryptedFile, format, opts.output);
        if (!opts.output) {
          process.stdout.write(output + '\n');
        } else {
          console.log(`Exported to ${opts.output}`);
        }
      } catch (err: any) {
        console.error('Export failed:', err.message);
        process.exit(1);
      }
    });
}
