import { Command } from 'commander';
import { addReminder, removeReminder, loadReminders, getDueReminders, formatReminders } from './remind';

export function registerRemindCommands(program: Command): void {
  const remind = program.command('remind').description('Manage .env rotation reminders');

  remind
    .command('add <file> <message>')
    .option('--due <date>', 'Due date (ISO format)')
    .description('Add a reminder for an env file')
    .action((file: string, message: string, opts: { due?: string }) => {
      const entry = addReminder(file, message, opts.due);
      console.log(`Reminder added for ${entry.file}: ${entry.message}`);
    });

  remind
    .command('list [file]')
    .description('List reminders, optionally filtered by file')
    .action((file?: string) => {
      const config = loadReminders();
      const list = file ? config.reminders.filter(r => r.file === file) : config.reminders;
      console.log(formatReminders(list));
    });

  remind
    .command('due')
    .description('Show reminders that are due now')
    .action(() => {
      const due = getDueReminders();
      if (due.length === 0) {
        console.log('No reminders due.');
      } else {
        console.log('Due reminders:');
        console.log(formatReminders(due));
      }
    });

  remind
    .command('remove <file> <index>')
    .description('Remove a reminder by file and index')
    .action((file: string, indexStr: string) => {
      const index = parseInt(indexStr, 10);
      const removed = removeReminder(file, index);
      console.log(removed ? 'Reminder removed.' : 'Reminder not found.');
    });
}
