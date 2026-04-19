import { Command } from 'commander';
import { addSnippet, removeSnippet, getSnippet, listSnippets, formatSnippets } from './snippet';

export function registerSnippetCommands(program: Command, cwd = process.cwd()): void {
  const snippet = program.command('snippet').description('Manage reusable env snippets');

  snippet
    .command('add <name> <content>')
    .option('-d, --description <desc>', 'snippet description')
    .description('Save a named env snippet')
    .action((name: string, content: string, opts: { description?: string }) => {
      const s = addSnippet(cwd, name, content, opts.description);
      console.log(`Snippet '${s.name}' saved.`);
    });

  snippet
    .command('remove <name>')
    .description('Remove a snippet by name')
    .action((name: string) => {
      const removed = removeSnippet(cwd, name);
      console.log(removed ? `Snippet '${name}' removed.` : `Snippet '${name}' not found.`);
    });

  snippet
    .command('get <name>')
    .description('Print a snippet by name')
    .action((name: string) => {
      const s = getSnippet(cwd, name);
      if (!s) { console.log(`Snippet '${name}' not found.`); return; }
      console.log(s.content);
    });

  snippet
    .command('list')
    .description('List all snippets')
    .action(() => {
      console.log(formatSnippets(listSnippets(cwd)));
    });
}
