import { Command } from 'commander';
import { registerNoteCommands } from './noteCommand';
import * as note from './note';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerNoteCommands(program);
  return program;
}

jest.mock('./note');

describe('registerNoteCommands', () => {
  beforeEach(() => jest.clearAllMocks());

  it('note add calls addNote', async () => {
    (note.addNote as jest.Mock).mockResolvedValue(undefined);
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'note', 'add', '.env', 'my note text']);
    expect(note.addNote).toHaveBeenCalledWith(expect.any(String), '.env', 'my note text');
  });

  it('note remove calls removeNote', async () => {
    (note.removeNote as jest.Mock).mockResolvedValue(undefined);
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'note', 'remove', '.env', '0']);
    expect(note.removeNote).toHaveBeenCalledWith(expect.any(String), '.env', 0);
  });

  it('note list calls getNotes and prints results', async () => {
    (note.getNotes as jest.Mock).mockResolvedValue([{ text: 'hello', createdAt: '2024-01-01' }]);
    (note.formatNotes as jest.Mock).mockReturnValue('hello (2024-01-01)');
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'note', 'list', '.env']);
    expect(note.getNotes).toHaveBeenCalledWith(expect.any(String), '.env');
    spy.mockRestore();
  });

  it('note list prints message when no notes', async () => {
    (note.getNotes as jest.Mock).mockResolvedValue([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'note', 'list', '.env']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No notes'));
    consoleSpy.mockRestore();
  });
});
