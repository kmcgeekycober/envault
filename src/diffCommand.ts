import { Command } from 'commander';
import * as fs from 'fs';
import { diffEnvFiles, formatDiff } from './diff';
import { decryptFile } from './gpg';
import * as os from 'os';
import * as path from 'path';

export function registerDiffCommands(program: Command): void {
  program
    .command('diff <fileA> <fileB>')
    .description('Show diff between two encrypted .env files')
    .option('--raw', 'Show raw decrypted content instead of formatted diff')
    .action(async (fileA: string, fileB: string, opts: { raw?: boolean }) => {
      const tmpA = path.join(os.tmpdir(), `envault-diff-a-${Date.now()}`);
      const tmpB = path.join(os.tmpdir(), `envault-diff-b-${Date.now()}`);
      try {
        await decryptFile(fileA, tmpA);
        await decryptFile(fileB, tmpB);
        const contentA = fs.readFileSync(tmpA, 'utf-8');
        const contentB = fs.readFileSync(tmpB, 'utf-8');
        if (opts.raw) {
          console.log('--- ' + fileA);
          console.log('+++ ' + fileB);
          console.log(contentB);
        } else {
          const diff = diffEnvFiles(contentA, contentB);
          console.log(formatDiff(diff));
        }
      } catch (err: any) {
        console.error('diff failed:', err.message);
        process.exit(1);
      } finally {
        for (const f of [tmpA, tmpB]) {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        }
      }
    });
}
