import { Command } from 'commander';
import * as fs from 'fs';
import { maskEnvFile, maskEnvEntries, MaskOptions } from './envMask';
import { parseEnvEntries } from './env';

export function registerEnvMaskCommands(program: Command): void {
  const mask = program.command('mask').description('Mask sensitive values in .env files');

  mask
    .command('show <file>')
    .description('Print env file with sensitive values masked')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to always mask')
    .option('-c, --char <char>', 'Mask character to use', '*')
    .option('-v, --visible <n>', 'Number of visible trailing characters', '4')
    .action((file: string, opts: { keys?: string; char: string; visible: string }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const options: MaskOptions = {
        maskChar: opts.char,
        visibleChars: parseInt(opts.visible, 10),
        keys: opts.keys ? opts.keys.split(',').map(k => k.trim()) : undefined,
      };
      const masked = maskEnvFile(file, options);
      console.log(masked);
    });

  mask
    .command('check <file>')
    .description('List which keys would be masked')
    .option('-k, --keys <keys>', 'Comma-separated list of additional keys to mask')
    .action((file: string, opts: { keys?: string }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const content = fs.readFileSync(file, 'utf-8');
      const entries = parseEnvEntries(content);
      const options: MaskOptions = {
        keys: opts.keys ? opts.keys.split(',').map(k => k.trim()) : undefined,
      };
      const masked = maskEnvEntries(entries, options);
      const maskedKeys = Object.keys(entries).filter(k => masked[k] !== entries[k]);
      if (maskedKeys.length === 0) {
        console.log('No sensitive keys detected.');
      } else {
        console.log(`Sensitive keys (${maskedKeys.length}):`);
        maskedKeys.forEach(k => console.log(`  - ${k}`));
      }
    });
}
