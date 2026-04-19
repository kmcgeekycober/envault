import { Command } from 'commander';
import { addNote, removeNote, getNotesForFile, loadNotes, formatNotes } from './note';

export function registerNoteCommands(program: Command): void {
  const note = program.command('note').description('Manage notes on env files');

  note
    .command('add <file> <text>')
    .option('--author <author>', 'Author name', process.env.USER || 'unknown')
    .description('Add a note to an env file')
    .action((file: string, text: string, opts: { author: string }) => {
      const n = addNote(process.cwd(), file, text, opts.author);
      console.log(`Note added: [${n.id}]`);
    });

  note
    .command('remove <id>')
    .description('Remove a note by ID')
    .action((id: string) => {
      const removed = removeNote(process.cwd(), id);
      console.log(removed ? `Note ${id} removed.` : `Note ${id} not found.`);
    });

  note
    .command('list')
    .option('--file <file>', 'Filter by env file')
    .description('List notes')
    .action((opts: { file?: string }) => {
      const notes = opts.file
        ? getNotesForFile(process.cwd(), opts.file)
        : loadNotes(process.cwd());
      console.log(formatNotes(notes));
    });
}
