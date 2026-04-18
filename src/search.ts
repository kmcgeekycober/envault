import * as fs from 'fs';
import { parseEnvFile } from './diff';

export interface SearchResult {
  file: string;
  key: string;
  value: string;
  line: number;
}

export function searchEnvKeys(
  files: string[],
  pattern: string,
  valueSearch = false
): SearchResult[] {
  const regex = new RegExp(pattern, 'i');
  const results: SearchResult[] = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const parsed = parseEnvFile(content);

    for (const [key, value] of Object.entries(parsed)) {
      const matches = valueSearch
        ? regex.test(key) || regex.test(value)
        : regex.test(key);

      if (matches) {
        const lineIndex = lines.findIndex((l) => l.startsWith(key + '='));
        results.push({ file, key, value, line: lineIndex + 1 });
      }
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[], showValues = false): string {
  if (results.length === 0) return 'No matches found.';

  const lines: string[] = [];
  let lastFile = '';

  for (const r of results) {
    if (r.file !== lastFile) {
      lines.push(`\n${r.file}`);
      lastFile = r.file;
    }
    const valueStr = showValues ? `=${r.value}` : '';
    lines.push(`  L${r.line}  ${r.key}${valueStr}`);
  }

  return lines.join('\n').trim();
}
