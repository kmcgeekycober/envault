import { Command } from 'commander';
import { acquireLock, releaseLock, readLock, formatLock } from './lock';

export function registerLockCommands(program: Command): void {
  const lock = program.command('lock').description('Manage file locks for .env files');

  lock
    .command('acquire <envFile> <user>')
    .description('Acquire a lock on an env file')
    .action((envFile: string, user: string) => {
      const entry = acquireLock(envFile, user);
      if (!entry) {
        const existing = readLock(envFile);
        console.error(`Lock already held: ${existing ? formatLock(existing) : 'unknown'}`);
        process.exit(1);
      }
      console.log(`Lock acquired for ${envFile} by ${user}`);
    });

  lock
    .command('release <envFile> <user>')
    .description('Release a lock on an env file')
    .action((envFile: string, user: string) => {
      const released = releaseLock(envFile, user);
      if (!released) {
        console.error(`Could not release lock. Either no lock exists or it belongs to another user.`);
        process.exit(1);
      }
      console.log(`Lock released for ${envFile}`);
    });

  lock
    .command('status <envFile>')
    .description('Check lock status of an env file')
    .action((envFile: string) => {
      const entry = readLock(envFile);
      if (!entry) {
        console.log(`No lock on ${envFile}`);
      } else {
        console.log(formatLock(entry));
      }
    });
}
