import * as fs from "fs";
import * as path from "path";

export interface QuotaConfig {
  maxKeys: number;
  maxFileSize: number; // bytes
  maxValueLength: number;
}

export interface QuotaResult {
  passed: boolean;
  keyCount: number;
  fileSize: number;
  maxValueLength: number;
  violations: string[];
}

const DEFAULT_QUOTA: QuotaConfig = {
  maxKeys: 100,
  maxFileSize: 1024 * 64, // 64KB
  maxValueLength: 1024,
};

export function getQuotaConfigPath(dir: string): string {
  return path.join(dir, ".envault", "quota.json");
}

export function loadQuotaConfig(dir: string): QuotaConfig {
  const p = getQuotaConfigPath(dir);
  if (!fs.existsSync(p)) return { ...DEFAULT_QUOTA };
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    return { ...DEFAULT_QUOTA, ...raw };
  } catch (err) {
    throw new Error(`Failed to parse quota config at '${p}': ${(err as Error).message}`);
  }
}

export function saveQuotaConfig(dir: string, config: QuotaConfig): void {
  const p = getQuotaConfigPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2));
}

export function checkEnvQuota(envPath: string, config: QuotaConfig): QuotaResult {
  const violations: string[] = [];
  if (!fs.existsSync(envPath)) {
    return { passed: false, keyCount: 0, fileSize: 0, maxValueLength: 0, violations: ["File not found"] };
  }
  const content = fs.readFileSync(envPath, "utf8");
  const fileSize = Buffer.byteLength(content, "utf8");
  const lines = content.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  const keyCount = lines.length;
  let maxValueLength = 0;
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx !== -1) {
      const val = line.slice(idx + 1);
      if (val.length > maxValueLength) maxValueLength = val.length;
      if (val.length > config.maxValueLength) {
        const key = line.slice(0, idx);
        violations.push(`Value for '${key}' exceeds max length (${val.length} > ${config.maxValueLength})`);
      }
    }
  }
  if (keyCount > config.maxKeys) violations.push(`Too many keys (${keyCount} > ${config.maxKeys})`);
  if (fileSize > config.maxFileSize) violations.push(`File too large (${fileSize} > ${config.maxFileSize} bytes)`);
  return { passed: violations.length === 0, keyCount, fileSize, maxValueLength, violations };
}

export function formatQuotaResult(result: QuotaResult): string {
  const lines = [
    `Keys: ${result.keyCount}`,
    `File size: ${result.fileSize} bytes`,
    `Max value length: ${result.maxValueLength}`,
    result.passed ? "✓ All quota checks passed" : "✗ Quota violations:",
    ...result.violations.map((v) => `  - ${v}`),
  ];
  return lines.join("\n");
}
