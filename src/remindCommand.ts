import { Command } from 'commander';
import { v4 as uuidv4 } from 'uuid';
import {
  addReminder,
  removeReminder,
  loadReminders,
  getDueReminders,
  formatReminders,
} from './remind';

export function registerRemindCommands(program: Command): void {
  const remind = program.command('remind').description('Manage .env rotation reminders');

  remind
    .command('add <message>')
    .description('Add a reminder')
    .option('--due <date>', 'Due date (YYYY-MM-DD)', '')
    .option('--file <file>', 'Target env file', '.env')
    .action((message: string, opts) => {
      const id = uuidv4();
      const dueDate = opts.due || new Date().toISOString().slice(0, 10);
      addReminder(process.cwd(), { id, message, dueDate, file: opts.file });
      console.log(`Reminder added: [${id}] ${message} due ${dueDate}`);
    });

  remind
    .command('remove <id>')
    .description('Remove a reminder by ID')
    .action((id: string) => {
      removeReminder(process.cwd(), id);
      console.log(`Reminder ${id} removed.`);
    });

  remind
    .command('list')
    .description('List all reminders')
    .action(() => {
      const reminders = loadReminders(process.cwd());
      console.log(formatReminders(reminders));
    });

  remind
    .command('due')
    .description('Show reminders that are due')
    .action(() => {
      const due = getDueReminders(process.cwd());
      if (due.length === 0) {
        console.log('No reminders due.');
      } else {
        console.log('Due reminders:\n' + formatReminders(due));
      }
    });
}
