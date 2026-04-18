import { Command } from 'commander';
import { lintEnvFile, formatLintResults, LintResult } from './lint';

export function registerLintCommands(program: Command): void {
  program
    .command('lint [files...]')
    .description('Lint .env files for common issues')
    .option('--errors-only', 'Only report errors, not warnings')
    .option('--json', 'Output results as JSON')
    .action((files: string[], opts: { errorsOnly?: boolean; json?: boolean }) => {
      const targets = files.length > 0 ? files : ['.env'];
      const results: LintResult[] = [];

      for (const file of targets) {
        try {
          const result = lintEnvFile(file);
          if (opts.errorsOnly) {
            result.issues = result.issues.filter(i => i.severity === 'error');
          }
          results.push(result);
        } catch (err: any) {
          console.error(`Could not read file '${file}': ${err.message}`);
          process.exit(1);
        }
      }

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(formatLintResults(results));
      }

      const hasErrors = results.some(r => r.issues.some(i => i.severity === 'error'));
      if (hasErrors) process.exit(1);
    });
}
