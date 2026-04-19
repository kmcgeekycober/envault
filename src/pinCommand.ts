import { Command } from 'commander';
import { addPin, removePin, listPins, formatPins } from './pin';

export function registerPinCommands(program: Command): void {
  const pin = program.command('pin').description('Manage pinned env files');

  pin
    .command('add <file>')
    .description('Pin an env file for quick access')
    .option('-l, --label <label>', 'Optional label for the pin')
    .action((file: string, opts: { label?: string }) => {
      const entry = addPin(file, opts.label);
      console.log(`Pinned: ${entry.file}${entry.label ? ` (${entry.label})` : ''}`);
    });

  pin
    .command('remove <file>')
    .description('Remove a pinned env file')
    .action((file: string) => {
      const removed = removePin(file);
      if (removed) {
        console.log(`Unpinned: ${file}`);
      } else {
        console.error(`No pin found for: ${file}`);
        process.exit(1);
      }
    });

  pin
    .command('list')
    .description('List all pinned env files')
    .action(() => {
      const pins = listPins();
      console.log(formatPins(pins));
    });
}
