import { Command } from 'commander';
import { addAlias, removeAlias, loadAliases, formatAliases } from './alias';

export function registerAliasCommands(program: Command): void {
  const alias = program.command('alias').description('Manage env file aliases');

  alias
    .command('add <name> <target>')
    .description('Add an alias for an env file path')
    .action((name: string, target: string) => {
      addAlias(name, target);
      console.log(`Alias '${name}' -> '${target}' added.`);
    });

  alias
    .command('remove <name>')
    .description('Remove an alias')
    .action((name: string) => {
      try {
        removeAlias(name);
        console.log(`Alias '${name}' removed.`);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  alias
    .command('list')
    .description('List all aliases')
    .action(() => {
      const aliases = loadAliases();
      console.log(formatAliases(aliases));
    });
}
