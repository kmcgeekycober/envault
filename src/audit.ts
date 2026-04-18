import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
  timestamp: string;
  action: 'encrypt' | 'decrypt' | 'add-recipient' | 'remove-recipient' | 'sync';
  user: string;
  file: string;
  details?: string;
}

const AUDIT_LOG_PATH = path.join(os.homedir(), '.envault', 'audit.log');

export function ensureAuditDir(): void {
  const dir = path.dirname(AUDIT_LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function logAuditEntry(entry: AuditEntry): void {
  ensureAuditDir();
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(AUDIT_LOG_PATH, line, 'utf-8');
}

export function readAuditLog(logPath: string = AUDIT_LOG_PATH): AuditEntry[] {
  if (!fs.existsSync(logPath)) return [];
  const content = fs.readFileSync(logPath, 'utf-8');
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditEntry);
}

export function createAuditEntry(
  action: AuditEntry['action'],
  user: string,
  file: string,
  details?: string
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    action,
    user,
    file,
    details,
  };
}

export function formatAuditLog(entries: AuditEntry[]): string {
  if (entries.length === 0) return 'No audit entries found.';
  return entries
    .map(
      (e) =>
        `[${e.timestamp}] ${e.action.toUpperCase()} by ${e.user} on ${e.file}${
          e.details ? ` (${e.details})` : ''
        }`
    )
    .join('\n');
}
