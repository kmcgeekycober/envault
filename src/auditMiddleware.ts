import { logAuditEntry, createAuditEntry, AuditEntry } from './audit';
import { getGitUser } from './sync';

export type AuditableAction = AuditEntry['action'];

/**
 * Wraps an async operation and logs an audit entry before and/or after.
 */
export async function withAudit<T>(
  action: AuditableAction,
  file: string,
  fn: () => Promise<T>,
  details?: string
): Promise<T> {
  let user = 'unknown';
  try {
    user = await getGitUser();
  } catch {
    // fallback to unknown
  }

  const entry = createAuditEntry(action, user, file, details);

  try {
    const result = await fn();
    logAuditEntry(entry);
    return result;
  } catch (err) {
    const failEntry = createAuditEntry(
      action,
      user,
      file,
      `FAILED: ${(err as Error).message}`
    );
    logAuditEntry(failEntry);
    throw err;
  }
}

export function auditSync(
  action: AuditableAction,
  file: string,
  fn: () => void,
  details?: string
): void {
  let user = 'unknown';
  try {
    const { execSync } = require('child_process');
    user = execSync('git config user.email', { encoding: 'utf-8' }).trim();
  } catch {
    // fallback
  }

  const entry = createAuditEntry(action, user, file, details);
  try {
    fn();
    logAuditEntry(entry);
  } catch (err) {
    logAuditEntry(createAuditEntry(action, user, file, `FAILED: ${(err as Error).message}`));
    throw err;
  }
}
