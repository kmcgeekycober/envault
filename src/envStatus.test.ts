import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { formatEnvStatus } from "./envStatus";
import { jest } from "@jest/globals";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-status-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

jest.mock("./vault", () => ({
  loadConfig: jest.fn().mockResolvedValue({ recipients: ["alice@example.com"] }),
}));

jest.mock("./sync", () => ({
  getSyncStatus: jest.fn().mockResolvedValue({ inSync: true }),
}));

jest.mock("./ttl", () => ({
  loadTtlConfig: jest.fn().mockResolvedValue({}),
}));

jest.mock("./ttlMiddleware", () => ({
  checkTtlExpiry: jest.fn().mockReturnValue(false),
}));

describe("formatEnvStatus", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns exists=true when env file is present", async () => {
    const envFile = writeEnv(tmpDir, ".env", "KEY=value\n");
    const result = await formatEnvStatus(envFile, tmpDir);
    expect(result.exists).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.lastModified).not.toBeNull();
  });

  it("returns exists=false when env file is missing", async () => {
    const envFile = path.join(tmpDir, ".env.missing");
    const result = await formatEnvStatus(envFile, tmpDir);
    expect(result.exists).toBe(false);
    expect(result.sizeBytes).toBeNull();
    expect(result.lastModified).toBeNull();
  });

  it("detects encrypted file when .gpg copy exists", async () => {
    const envFile = writeEnv(tmpDir, ".env", "A=1\n");
    fs.writeFileSync(envFile + ".gpg", "encrypted", "utf-8");
    const result = await formatEnvStatus(envFile, tmpDir);
    expect(result.encryptedExists).toBe(true);
  });

  it("reports recipients from vault config", async () => {
    const envFile = writeEnv(tmpDir, ".env", "B=2\n");
    const result = await formatEnvStatus(envFile, tmpDir);
    expect(result.recipients).toEqual(["alice@example.com"]);
  });

  it("reports syncStatus as in-sync", async () => {
    const envFile = writeEnv(tmpDir, ".env", "C=3\n");
    const result = await formatEnvStatus(envFile, tmpDir);
    expect(result.syncStatus).toBe("in-sync");
  });

  it("reports ttlExpired=false when no TTL entry exists", async () => {
    const envFile = writeEnv(tmpDir, ".env", "D=4\n");
    const result = await formatEnvStatus(envFile, tmpDir);
    expect(result.ttlExpired).toBe(false);
    expect(result.ttlExpiresAt).toBeNull();
  });
});
