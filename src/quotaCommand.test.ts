import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerQuotaCommands } from "./quotaCommand";
import { saveQuotaConfig } from "./quota";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-quota-cmd-"));
}

function makeProgram(cwd: string): Command {
  const program = new Command();
  program.exitOverride();
  jest.spyOn(process, "cwd").mockReturnValue(cwd);
  registerQuotaCommands(program);
  return program;
}

describe("quotaCommand", () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); jest.restoreAllMocks(); });

  it("show returns default config when none saved", () => {
    const program = makeProgram(tmpDir);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "quota", "show"]);
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.maxKeys).toBe(100);
    spy.mockRestore();
  });

  it("set updates quota config", () => {
    const program = makeProgram(tmpDir);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "test", "quota", "set", "--max-keys", "50"]);
    spy.mockRestore();
    const program2 = makeProgram(tmpDir);
    const spy2 = jest.spyOn(console, "log").mockImplementation(() => {});
    program2.parse(["node", "test", "quota", "show"]);
    const parsed = JSON.parse(spy2.mock.calls[0][0]);
    expect(parsed.maxKeys).toBe(50);
    spy2.mockRestore();
  });

  it("check passes for valid env file", () => {
    const envFile = path.join(tmpDir, ".env");
    fs.writeFileSync(envFile, "FOO=bar\nBAZ=qux\n");
    const program = makeProgram(tmpDir);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    expect(() => program.parse(["node", "test", "quota", "check", ".env"])).not.toThrow();
    expect(spy.mock.calls[0][0]).toContain("passed");
    spy.mockRestore();
  });
});
