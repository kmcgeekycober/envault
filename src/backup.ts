import * as fs from 'fs';
import * as path from 'path';

export interface BackupEntry {
  file: string;
  backupPath: string;
  timestamp: string;
  size: number;
}

export function getBackupDir(vaultDir: string = '.envault'): string {
  return path.join(vaultDir, 'backups');
}

export function ensureBackupDir(vaultDir: string = '.envault'): void {
  const dir = getBackupDir(vaultDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function backupFile(filePath: string, vaultDir: string = '.envault'): BackupEntry {
  ensureBackupDir(vaultDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.basename(filePath);
  const backupName = `${baseName}.${timestamp}.bak`;
  const backupPath = path.join(getBackupDir(vaultDir), backupName);
  const content = fs.readFileSync(filePath);
  fs.writeFileSync(backupPath, content);
  return {
    file: filePath,
    backupPath,
    timestamp: new Date().toISOString(),
    size: content.length,
  };
}

export function listBackups(filePath: string, vaultDir: string = '.envault'): BackupEntry[] {
  const dir = getBackupDir(vaultDir);
  if (!fs.existsSync(dir)) return [];
  const baseName = path.basename(filePath);
  return fs.readdirSync(dir)
    .filter(f => f.startsWith(baseName) && f.endsWith('.bak'))
    .map(f => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      return {
        file: filePath,
        backupPath: full,
        timestamp: stat.mtime.toISOString(),
        size: stat.size,
      };
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function restoreBackup(backupPath: string, targetPath: string): void {
  const content = fs.readFileSync(backupPath);
  fs.writeFileSync(targetPath, content);
}

export function formatBackupList(entries: BackupEntry[]): string {
  if (entries.length === 0) return 'No backups found.';
  return entries.map((e, i) =>
    `[${i + 1}] ${e.timestamp}  ${path.basename(e.backupPath)}  (${e.size} bytes)`
  ).join('\n');
}
