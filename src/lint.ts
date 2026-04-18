import * as fs from 'fs';

export interface LintResult {
  file: string;
  issues: LintIssue[];
}

export interface LintIssue {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export function lintEnvFile(filePath: string): LintResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  return lintEnvContent(filePath, content);
}

export function lintEnvContent(file: string, content: string): LintResult {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) return;

    if (!trimmed.includes('=')) {
      issues.push({ line: lineNum, message: `Missing '=' in assignment`, severity: 'error' });
      return;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');

    if (!key.match(/^[A-Z_][A-Z0-9_]*$/)) {
      issues.push({ line: lineNum, message: `Key '${key}' should be uppercase with underscores`, severity: 'warning' });
    }

    if (value === '') {
      issues.push({ line: lineNum, message: `Key '${key}' has an empty value`, severity: 'warning' });
    }

    if (value.includes(' ') && !value.startsWith('"') && !value.startsWith("'")) {
      issues.push({ line: lineNum, message: `Value for '${key}' contains spaces but is not quoted`, severity: 'warning' });
    }
  });

  return { file, issues };
}

export function formatLintResults(results: LintResult[]): string {
  const lines: string[] = [];
  for (const result of results) {
    if (result.issues.length === 0) {
      lines.push(`✓ ${result.file}: no issues`);
      continue;
    }
    lines.push(`✗ ${result.file}:`);
    for (const issue of result.issues) {
      const icon = issue.severity === 'error' ? '  [error]' : '  [warn] ';
      lines.push(`${icon} line ${issue.line}: ${issue.message}`);
    }
  }
  return lines.join('\n');
}
