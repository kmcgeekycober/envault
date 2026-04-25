import { Command } from 'commander';
import * as path from 'path';
import { backupFile, listBackups, restoreBackup, getBackupDir } from './backup';

export function registerBackupCommands(program: Command): void {
  const backup = program.command('backup').description('Manage env file backups');

  backup
    .command('create <envFile>')
    .description('Create a backup of an env file')
    .action(async (envFile: string) => {
      try {
        const abs = path.resolve(envFile);
        const dest = await backupFile(abs);
        console.log(`Backup created: ${dest}`);
      } catch (err: any) {
        console.error(`Error creating backup: ${err.message}`);
        process.exit(1);
      }
    });

  backup
    .command('list <envFile>')
    .description('List backups for an env file')
    .action(async (envFile: string) => {
      try {
        const abs = path.resolve(envFile);
        const backups = await listBackups(abs);
        if (backups.length === 0) {
          console.log('No backups found.');
        } else {
          backups.forEach((b, i) => console.log(`[${i}] ${b}`));
        }
      } catch (err: any) {
        console.error(`Error listing backups: ${err.message}`);
        process.exit(1);
      }
    });

  backup
    .command('restore <envFile> <index>')
    .description('Restore a backup by index')
    .action(async (envFile: string, index: string) => {
      try {
        const abs = path.resolve(envFile);
        const backups = await listBackups(abs);
        const idx = parseInt(index, 10);
        if (isNaN(idx) || idx < 0 || idx >= backups.length) {
          console.error(`Invalid index: ${index}. Valid range is 0-${backups.length - 1}.`);
          process.exit(1);
        }
        await restoreBackup(backups[idx], abs);
        console.log(`Restored backup: ${backups[idx]}`);
      } catch (err: any) {
        console.error(`Error restoring backup: ${err.message}`);
        process.exit(1);
      }
    });

  backup
    .command('dir <envFile>')
    .description('Show the backup directory for an env file')
    .action((envFile: string) => {
      const abs = path.resolve(envFile);
      const dir = getBackupDir(abs);
      console.log(`Backup directory: ${dir}`);
    });
}
