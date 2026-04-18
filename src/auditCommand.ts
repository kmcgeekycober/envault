import { Command } from 'commander';
import { readAuditLog, formatAuditLog, AuditEntry } from './audit';

export function registerAuditCommands(program: Command): void {
  const audit = program.command('audit').description('Manage audit logs');

  audit
    .command('show')
    .description('Show the audit log')
    .option('-n, --limit <number>', 'Limit number of entries shown', '50')
    .option('--action <action>', 'Filter by action type')
    .option('--user <user>', 'Filter by user')
    .action((opts) => {
      let entries: AuditEntry[] = readAuditLog();

      if (opts.action) {
        entries = entries.filter((e) => e.action === opts.action);
      }
      if (opts.user) {
        entries = entries.filter((e) => e.user === opts.user);
      }

      const limit = parseInt(opts.limit, 10);
      entries = entries.slice(-limit);

      console.log(formatAuditLog(entries));
    });

  audit
    .command('clear')
    .description('Clear the audit log (irreversible)')
    .option('--confirm', 'Confirm the clear operation')
    .action((opts) => {
      if (!opts.confirm) {
        console.error('Pass --confirm to clear the audit log.');
        process.exit(1);
      }
      const { execSync } = require('child_process');
      const os = require('os');
      const path = require('path');
      const logPath = path.join(os.homedir(), '.envault', 'audit.log');
      const fs = require('fs');
      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
        console.log('Audit log cleared.');
      } else {
        console.log('No audit log found.');
      }
    });
}
