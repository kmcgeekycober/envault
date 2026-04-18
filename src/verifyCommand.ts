import { Command } from 'commander';
import * as path from 'path';
import { loadConfig } from './vault';
import { getEncryptedFilePath } from './sync';
import { verifyEncryptedFile, formatVerifyResult } from './verify';
import { logAuditEntry, createAuditEntry } from './audit';

export function registerVerifyCommands(program: Command): void {
  program
    .command('verify [envfile]')
    .description('Verify GPG signature of an encrypted .env file')
    .option('--all', 'Verify all encrypted files listed in vault config')
    .action(async (envfile: string | undefined, opts: { all?: boolean }) => {
      const config = loadConfig();
      const targets: string[] = opts.all
        ? (config.files ?? ['.env']).map((f: string) => getEncryptedFilePath(f))
        : [getEncryptedFilePath(envfile ?? '.env')];

      let anyFailed = false;
      for (const target of targets) {
        const result = verifyEncryptedFile(target);
        console.log(formatVerifyResult(result, path.relative(process.cwd(), target)));
        const entry = createAuditEntry({
          action: 'verify',
          file: target,
          success: result.valid,
          detail: result.error ?? result.signer ?? '',
        });
        logAuditEntry(entry);
        if (!result.valid) anyFailed = true;
      }
      if (anyFailed) process.exit(1);
    });
}
