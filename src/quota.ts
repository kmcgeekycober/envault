import * as fs from 'fs';
import * as path from 'path';

export interface QuotaConfig {
  maxKeys: number;
  maxFileSizeBytes: number;
  maxRecipients: number;
}

export interface QuotaCheckResult {
  passed: boolean;
  violations: string[];
}

const DEFAULT_QUOTA: QuotaConfig = {
  maxKeys: 100,
  maxFileSizeBytes: 1024 * 1024, // 1MB
  maxRecipients: 20,
};

export function getQuotaConfigPath(vaultDir: string): string {
  return path.join(vaultDir, 'quota.json');
}

export function loadQuotaConfig(vaultDir: string): QuotaConfig {
  const p = getQuotaConfigPath(vaultDir);
  if (!fs.existsSync(p)) return { ...DEFAULT_QUOTA };
  try {
    return { ...DEFAULT_QUOTA, ...JSON.parse(fs.readFileSync(p, 'utf-8')) };
  } catch {
    return { ...DEFAULT_QUOTA };
  }
}

export function saveQuotaConfig(vaultDir: string, config: QuotaConfig): void {
  fs.writeFileSync(getQuotaConfigPath(vaultDir), JSON.stringify(config, null, 2));
}

export function checkEnvQuota(
  envFilePath: string,
  recipients: string[],
  quota: QuotaConfig
): QuotaCheckResult {
  const violations: string[] = [];

  if (!fs.existsSync(envFilePath)) {
    return { passed: true, violations: [] };
  }

  const stat = fs.statSync(envFilePath);
  if (stat.size > quota.maxFileSizeBytes) {
    violations.push(
      `File size ${stat.size} bytes exceeds limit of ${quota.maxFileSizeBytes} bytes`
    );
  }

  const content = fs.readFileSync(envFilePath, 'utf-8');
  const keyCount = content
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('=')).length;

  if (keyCount > quota.maxKeys) {
    violations.push(`Key count ${keyCount} exceeds limit of ${quota.maxKeys}`);
  }

  if (recipients.length > quota.maxRecipients) {
    violations.push(
      `Recipient count ${recipients.length} exceeds limit of ${quota.maxRecipients}`
    );
  }

  return { passed: violations.length === 0, violations };
}

export function formatQuotaResult(result: QuotaCheckResult): string {
  if (result.passed) return '✔ Quota check passed.';
  return ['✖ Quota check failed:', ...result.violations.map((v) => `  - ${v}`)].join('\n');
}
