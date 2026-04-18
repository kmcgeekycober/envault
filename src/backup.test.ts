import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  backupFile,
  listBackups,
  restoreBackup,
  formatBackupList,
  getBackupDir,
} from './backup';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-backup-'));
}

describe('backup', () => {
  let tmp: string;
  let vaultDir: string;
  let envFile: string;

  beforeEach(() => {
    tmp = makeTmpDir();
    vaultDir = path.join(tmp, '.envault');
    envFile = path.join(tmp, '.env');
    fs.writeFileSync(envFile, 'KEY=value\nSECRET=abc\n');
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('backupFile creates a backup in the backup dir', () => {
    const entry = backupFile(envFile, vaultDir);
    expect(fs.existsSync(entry.backupPath)).toBe(true);
    expect(entry.file).toBe(envFile);
    expect(entry.size).toBeGreaterThan(0);
  });

  it('listBackups returns entries for the given file', () => {
    backupFile(envFile, vaultDir);
    backupFile(envFile, vaultDir);
    const entries = listBackups(envFile, vaultDir);
    expect(entries.length).toBe(2);
  });

  it('listBackups returns empty array when no backups exist', () => {
    const entries = listBackups(envFile, vaultDir);
    expect(entries).toEqual([]);
  });

  it('restoreBackup restores file content', () => {
    const entry = backupFile(envFile, vaultDir);
    const restored = path.join(tmp, '.env.restored');
    restoreBackup(entry.backupPath, restored);
    const content = fs.readFileSync(restored, 'utf8');
    expect(content).toBe('KEY=value\nSECRET=abc\n');
  });

  it('formatBackupList formats entries', () => {
    const entry = backupFile(envFile, vaultDir);
    const result = formatBackupList([entry]);
    expect(result).toContain('[1]');
    expect(result).toContain('bytes');
  });

  it('formatBackupList returns message when empty', () => {
    expect(formatBackupList([])).toBe('No backups found.');
  });

  it('getBackupDir returns correct path', () => {
    expect(getBackupDir('.envault')).toBe(path.join('.envault', 'backups'));
  });
});
