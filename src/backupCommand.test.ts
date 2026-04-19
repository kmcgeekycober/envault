import { Command } from 'commander';
import { registerBackupCommands } from './backupCommand';
import * as backup from './backup';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerBackupCommands(program);
  return program;
}

describe('backupCommand', () => {
  afterEach(() => jest.restoreAllMocks());

  it('backup create calls backupFile and logs result', async () => {
    jest.spyOn(backup, 'backupFile').mockResolvedValue('/backups/.env.2024.bak');
    const log = jest.spyOn(console, 'log').mockImplementation();
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'backup', 'create', '.env']);
    expect(backup.backupFile).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Backup created'));
  });

  it('backup create logs error on failure', async () => {
    jest.spyOn(backup, 'backupFile').mockRejectedValue(new Error('disk full'));
    const err = jest.spyOn(console, 'error').mockImplementation();
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(program.parseAsync(['node', 'test', 'backup', 'create', '.env'])).rejects.toThrow();
    expect(err).toHaveBeenCalledWith(expect.stringContaining('disk full'));
  });

  it('backup list prints backups', async () => {
    jest.spyOn(backup, 'listBackups').mockResolvedValue(['/backups/a.bak', '/backups/b.bak']);
    const log = jest.spyOn(console, 'log').mockImplementation();
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'backup', 'list', '.env']);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[0]'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[1]'));
  });

  it('backup list prints no backups message', async () => {
    jest.spyOn(backup, 'listBackups').mockResolvedValue([]);
    const log = jest.spyOn(console, 'log').mockImplementation();
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'backup', 'list', '.env']);
    expect(log).toHaveBeenCalledWith('No backups found.');
  });

  it('backup restore calls restoreBackup with correct file', async () => {
    jest.spyOn(backup, 'listBackups').mockResolvedValue(['/backups/a.bak', '/backups/b.bak']);
    jest.spyOn(backup, 'restoreBackup').mockResolvedValue();
    const log = jest.spyOn(console, 'log').mockImplementation();
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'backup', 'restore', '.env', '1']);
    expect(backup.restoreBackup).toHaveBeenCalledWith('/backups/b.bak', expect.any(String));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Restored'));
  });

  it('backup restore exits on invalid index', async () => {
    jest.spyOn(backup, 'listBackups').mockResolvedValue(['/backups/a.bak']);
    const err = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(program.parseAsync(['node', 'test', 'backup', 'restore', '.env', '5'])).rejects.toThrow();
    expect(err).toHaveBeenCalledWith(expect.stringContaining('Invalid index'));
  });
});
