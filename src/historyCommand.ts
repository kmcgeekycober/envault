import { Command } from 'commander';
import { getFileHistory, loadHistory, formatHistory } from './history';

export function registerHistoryCommands(program: Command): void {
  const history = program.command('history').description('View encryption/sync history');

  history
    .command('list')
    .description('List all history entries')
    .option('--file <file>', 'Filter by env file')
    .option('--limit <n>', 'Max entries to show', '20')
    .action((opts) => {
      const entries = opts.file
        ? getFileHistory(opts.file)
        : loadHistory();
      const limited = entries.slice(-parseInt(opts.limit));
      console.log(formatHistory(limited));
    });

  history
    .command('clear')
    .description('Clear all history')
    .action(() => {
      const { saveHistory } = require('./history');
      saveHistory([]);
      console.log('History cleared.');
    });
}
