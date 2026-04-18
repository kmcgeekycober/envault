import { Command } from 'commander';
import { searchEnvKeys, formatSearchResults } from './search';
import { loadConfig } from './vault';

export function registerSearchCommands(program: Command): void {
  program
    .command('search <query>')
    .description('Search for keys across encrypted .env files')
    .option('-f, --file <path>', 'path to encrypted env file')
    .option('--json', 'output results as JSON')
    .option('-i, --ignore-case', 'case-insensitive search')
    .action(async (query: string, opts) => {
      try {
        const config = await loadConfig();
        const filePath = opts.file ?? config.encryptedFile ?? '.env.vault';

        const results = await searchEnvKeys(filePath, query, {
          ignoreCase: opts.ignoreCase ?? false,
        });

        if (results.length === 0) {
          console.log(`No keys matching "${query}" found.`);
          return;
        }

        if (opts.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          console.log(formatSearchResults(results, query));
        }
      } catch (err: any) {
        console.error('Search failed:', err.message);
        process.exit(1);
      }
    });
}
