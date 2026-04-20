import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getQuotaConfigPath,
  loadQuotaConfig,
  saveQuotaConfig,
  checkEnvQuota,
  formatQuotaResult,
} from "./quota";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-quota-"));
}

describe("quota", () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it("getQuotaConfigPath returns correct path", () => {
    expect(getQuotaConfigPath("/project")).toBe("/project/.envault/quota.json");
  });

  it("loadQuotaConfig returns defaults when file missing", () => {
    const config = loadQuotaConfig(tmpDir);
    expect(config.maxKeys).toBe(100);
    expect(config.maxFileSize).toBeGreaterThan(0);
  });

  it("saveQuotaConfig and loadQuotaConfig round-trip", () => {
    saveQuotaConfig(tmpDir, { maxKeys: 20, maxFileSize: 512, maxValueLength: 64 });
    const config = loadQuotaConfig(tmpDir);
    expect(config.maxKeys).toBe(20);
    expect(config.maxFileSize).toBe(512);
    expect(config.maxValueLength).toBe(64);
  });

  it("checkEnvQuota passes for valid file", () => {
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, "FOO=bar\nBAZ=qux\n");
    const config = loadQuotaConfig(tmpDir);
    const result = checkEnvQuota(envPath, config);
    expect(result.passed).toBe(true);
    expect(result.keyCount).toBe(2);
    expect(result.violations).toHaveLength(0);
  });

  it("checkEnvQuota detects too many keys", () => {
    const envPath = path.join(tmpDir, ".env");
    const lines = Array.from({ length: 5 }, (_, i) => `KEY${i}=val`).join("\n");
    fs.writeFileSync(envPath, lines);
    const result = checkEnvQuota(envPath, { maxKeys: 3, maxFileSize: 1024 * 64, maxValueLength: 1024 });
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes("Too many keys"))).toBe(true);
  });

  it("checkEnvQuota detects oversized value", () => {
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, `BIG=${'x'.repeat(200)}\n`);
    const result = checkEnvQuota(envPath, { maxKeys: 100, maxFileSize: 1024 * 64, maxValueLength: 50 });
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes("BIG"))).toBe(true);
  });

  it("formatQuotaResult shows passed message", () => {
    const r = { passed: true, keyCount: 2, fileSize: 30, maxValueLength: 5, violations: [] };
    expect(formatQuotaResult(r)).toContain("passed");
  });

  it("formatQuotaResult lists violations", () => {
    const r = { passed: false, keyCount: 200, fileSize: 30, maxValueLength: 5, violations: ["Too many keys"] };
    expect(formatQuotaResult(r)).toContain("Too many keys");
  });
});
