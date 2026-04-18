import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createAuditEntry,
  formatAuditLog,
  logAuditEntry,
  readAuditLog,
  AuditEntry,
} from './audit';

const tmpLog = path.join(os.tmpdir(), `envault-audit-test-${Date.now()}.log`);

afterEach(() => {
  if (fs.existsSync(tmpLog)) fs.unlinkSync(tmpLog);
});

describe('createAuditEntry', () => {
  it('creates an entry with correct fields', () => {
    const entry = createAuditEntry('encrypt', 'alice', '.env', 'test');
    expect(entry.action).toBe('encrypt');
    expect(entry.user).toBe('alice');
    expect(entry.file).toBe('.env');
    expect(entry.details).toBe('test');
    expect(entry.timestamp).toBeTruthy();
  });

  it('creates entry without details', () => {
    const entry = createAuditEntry('sync', 'bob', '.env.production');
    expect(entry.details).toBeUndefined();
  });
});

describe('logAuditEntry and readAuditLog', () => {
  it('writes and reads entries', () => {
    const entry: AuditEntry = createAuditEntry('decrypt', 'carol', '.env');
    fs.writeFileSync(tmpLog, JSON.stringify(entry) + '\n', 'utf-8');
    const entries = readAuditLog(tmpLog);
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('decrypt');
    expect(entries[0].user).toBe('carol');
  });

  it('returns empty array when log does not exist', () => {
    const entries = readAuditLog('/nonexistent/path/audit.log');
    expect(entries).toEqual([]);
  });
});

describe('formatAuditLog', () => {
  it('formats entries as readable strings', () => {
    const entries: AuditEntry[] = [
      createAuditEntry('add-recipient', 'dave', '.env', 'fingerprint:ABCD1234'),
    ];
    const output = formatAuditLog(entries);
    expect(output).toContain('ADD-RECIPIENT');
    expect(output).toContain('dave');
    expect(output).toContain('fingerprint:ABCD1234');
  });

  it('returns message when no entries', () => {
    expect(formatAuditLog([])).toBe('No audit entries found.');
  });
});
