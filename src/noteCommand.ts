import { Command } from 'commander';
import * as path from 'path';
import { addNote, removeNote, getNotes, formatNotes } from './note';

export function registerNoteCommands(program: Command): void {
  const noteCmd = program.command('note').description('Manage notes for env files');

  noteCmd
    .command('add <file> <text>')
    .description('Add a note to an env file')
    .action(async (file: string, text: string) => {
      const dir = process.cwd();
      await addNote(dir, file, text);
      console.log(`Note added to ${file}.`);
    });

  noteCmd
    .command('remove <file> <index>')
    .description('Remove a note by index from an env file')
    .action(async (file: string, index: string) => {
      const dir = process.cwd();
      await removeNote(dir, file, parseInt(index, 10));
      console.log(`Note removed from ${file}.`);
    });

  noteCmd
    .command('list <file>')
    .description('List all notes for an env file')
    .action(async (file: string) => {
      const dir = process.cwd();
      const notes = await getNotes(dir, file);
      if (notes.length === 0) {
        console.log(`No notes found for ${file}.`);
        return;
      }
      process.stdout.write(formatNotes(notes) + '\n');
    });
}
