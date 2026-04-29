import { describe, it, expect, vi, beforeEach } from "vitest";
import { encryptEnvFile, formatEncryptResult } from "./envEncrypt";

vi.mock("./gpg", () => ({
  encryptFile: vi.fn(),
}));

vi.mock("./vault", () => ({
  loadConfig: vi.fn(),
}));

import { encryptFile } from "./gpg";
import { loadConfig } from "./vault";

const mockEncryptFile = encryptFile as unknown as ReturnType<typeof vi.fn>;
const mockLoadConfig = loadConfig as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("encryptEnvFile", () => {
  it("returns error when no recipients configured", async () => {
    mockLoadConfig.mockResolvedValue({ recipients: [] });
    const result = await encryptEnvFile(".env");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No recipients/);
  });

  it("encrypts file with configured recipients", async () => {
    mockLoadConfig.mockResolvedValue({ recipients: ["alice@example.com"] });
    mockEncryptFile.mockResolvedValue(undefined);
    const result = await encryptEnvFile(".env");
    expect(result.success).toBe(true);
    expect(result.outputFile).toBe(".env.gpg");
    expect(result.recipients).toContain("alice@example.com");
  });

  it("merges extra recipients and deduplicates", async () => {
    mockLoadConfig.mockResolvedValue({ recipients: ["alice@example.com"] });
    mockEncryptFile.mockResolvedValue(undefined);
    const result = await encryptEnvFile(".env", undefined, ["alice@example.com", "bob@example.com"]);
    expect(result.recipients).toEqual(["alice@example.com", "bob@example.com"]);
  });

  it("returns error on gpg failure", async () => {
    mockLoadConfig.mockResolvedValue({ recipients: ["alice@example.com"] });
    mockEncryptFile.mockRejectedValue(new Error("gpg error"));
    const result = await encryptEnvFile(".env");
    expect(result.success).toBe(false);
    expect(result.error).toBe("gpg error");
  });

  it("uses custom output path", async () => {
    mockLoadConfig.mockResolvedValue({ recipients: ["alice@example.com"] });
    mockEncryptFile.mockResolvedValue(undefined);
    const result = await encryptEnvFile(".env", "out/.env.gpg");
    expect(result.outputFile).toBe("out/.env.gpg");
  });
});

describe("formatEncryptResult", () => {
  it("formats success result", () => {
    const out = formatEncryptResult({ inputFile: ".env", outputFile: ".env.gpg", recipients: ["a@b.com"], success: true });
    expect(out).toContain("✅");
    expect(out).toContain(".env.gpg");
    expect(out).toContain("a@b.com");
  });

  it("formats failure result", () => {
    const out = formatEncryptResult({ inputFile: ".env", outputFile: ".env.gpg", recipients: [], success: false, error: "oops" });
    expect(out).toContain("❌");
    expect(out).toContain("oops");
  });
});
