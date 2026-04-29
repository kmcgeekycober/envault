import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Command } from "commander";
import { registerEnvCompareCommands } from "./envCompareCommand";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-compare-cmd-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerEnvCompareCommands(program);
  return program;
}

describe("registerEnvCompareCommands", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    process.exitCode = 0;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.exitCode = 0;
  });

  it("outputs comparison for two identical files", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const b = writeEnv(dir, ".env.b", "FOO=bar\n");
    const program = makeProgram();
    program.parse(["node", "envault", "compare", a, b]);
    expect(consoleSpy).toHaveBeenCalled();
    expect(process.exitCode).toBeFalsy();
  });

  it("sets exitCode=1 when files differ", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const b = writeEnv(dir, ".env.b", "FOO=baz\n");
    const program = makeProgram();
    program.parse(["node", "envault", "compare", a, b]);
    expect(process.exitCode).toBe(1);
  });

  it("accepts custom labels", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const b = writeEnv(dir, ".env.b", "FOO=bar\n");
    const program = makeProgram();
    program.parse([
      "node", "envault", "compare", a, b,
      "--left-label", "staging",
      "--right-label", "production",
    ]);
    const output: string = consoleSpy.mock.calls[0][0];
    expect(output).toContain("staging");
    expect(output).toContain("production");
  });

  it("--only-diff hides matching keys", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\nBAR=same\n");
    const b = writeEnv(dir, ".env.b", "FOO=baz\nBAR=same\n");
    const program = makeProgram();
    program.parse(["node", "envault", "compare", a, b, "--only-diff"]);
    const output: string = consoleSpy.mock.calls[0][0];
    expect(output).not.toContain("= BAR");
  });
});
