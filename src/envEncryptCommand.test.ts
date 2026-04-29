import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { registerEnvEncryptCommands } from "./envEncryptCommand";

vi.mock("./envEncrypt", () => ({
  encryptEnvFile: vi.fn(),
  formatEncryptResult: vi.fn((r) => r.success ? "ok" : "fail"),
}));

import { encryptEnvFile } from "./envEncrypt";
const mockEncrypt = encryptEnvFile as unknown as ReturnType<typeof vi.fn>;

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerEnvEncryptCommands(program);
  return program;
}

beforeEach(() => vi.clearAllMocks());

describe("registerEnvEncryptCommands", () => {
  it("calls encryptEnvFile with correct args", async () => {
    mockEncrypt.mockResolvedValue({ success: true, inputFile: ".env", outputFile: ".env.gpg", recipients: [] });
    const program = makeProgram();
    await program.parseAsync(["node", "test", "encrypt", "run", ".env"]);
    expect(mockEncrypt).toHaveBeenCalledWith(".env", undefined, []);
  });

  it("passes output and recipient options", async () => {
    mockEncrypt.mockResolvedValue({ success: true, inputFile: ".env", outputFile: "out.gpg", recipients: ["x@y.com"] });
    const program = makeProgram();
    await program.parseAsync(["node", "test", "encrypt", "run", ".env", "-o", "out.gpg", "-r", "x@y.com"]);
    expect(mockEncrypt).toHaveBeenCalledWith(".env", "out.gpg", ["x@y.com"]);
  });

  it("exits with code 1 on failure", async () => {
    mockEncrypt.mockResolvedValue({ success: false, inputFile: ".env", outputFile: ".env.gpg", recipients: [], error: "bad" });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    const program = makeProgram();
    await program.parseAsync(["node", "test", "encrypt", "run", ".env"]);
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
