import { Command } from 'commander';
import {
  loadNamespaces,
  addNamespace,
  removeNamespace,
  setActiveNamespace,
  formatNamespaces,
} from './namespace';

export function registerNamespaceCommands(program: Command): void {
  const ns = program
    .command('namespace')
    .description('Manage env file namespaces');

  ns.command('list')
    .description('List all namespaces')
    .action(() => {
      const config = loadNamespaces();
      console.log(formatNamespaces(config));
    });

  ns.command('add <name> <envFile>')
    .description('Add a namespace mapping to an env file')
    .action((name: string, envFile: string) => {
      addNamespace(name, envFile);
      console.log(`Namespace "${name}" added -> ${envFile}`);
    });

  ns.command('remove <name>')
    .description('Remove a namespace')
    .action((name: string) => {
      try {
        removeNamespace(name);
        console.log(`Namespace "${name}" removed.`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  ns.command('use <name>')
    .description('Set the active namespace')
    .action((name: string) => {
      try {
        setActiveNamespace(name);
        console.log(`Active namespace set to "${name}".`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });
}
