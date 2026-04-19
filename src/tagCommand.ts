import { Command } from 'commander';
import { addTag, removeTag, loadTags, formatTags } from './tag';

export function registerTagCommands(program: Command): void {
  const tag = program.command('tag').description('Manage env file tags');

  tag
    .command('add <name> <files...>')
    .description('Tag one or more env files with a name')
    .action((name: string, files: string[]) => {
      const t = addTag(name, files);
      console.log(`Tag "${t.name}" saved with ${files.length} file(s).`);
    });

  tag
    .command('remove <name>')
    .description('Remove a tag')
    .action((name: string) => {
      const removed = removeTag(name);
      if (removed) console.log(`Tag "${name}" removed.`);
      else console.error(`Tag "${name}" not found.`);
    });

  tag
    .command('list')
    .description('List all tags')
    .action(() => {
      const store = loadTags();
      console.log(formatTags(store));
    });
}
