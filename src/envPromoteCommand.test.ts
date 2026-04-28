import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Command } from "commander";
import { registerEnvPromoteCommands } from "./envPromoteCommand";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envpromote-cmd-"));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerEnvPromoteCommands(program);
  return program;
}

describe("registerEnvPromoteCommands", () => {
  it("promotes specified keys", () => {
    const dir = makeTmpDir();
    const src = path.join(dir, ".env.staging");
    const tgt = path.join(dir, ".env.prod");
    fs.writeFileSync(src, "APP_KEY=abc\nSECRET=xyz\n");
    fs.writeFileSync(tgt, "");

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    program.parse(["node", "test", "run", src, tgt, "APP_KEY"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Promoted"));
    const content = fs.readFileSync(tgt, "utf8");
    expect(content).toContain("APP_KEY=abc");
    spy.mockRestore();
  });

  it("promotes all keys with --all flag", () => {
    const dir = makeTmpDir();
    const src = path.join(dir, ".env.a");
    const tgt = path.join(dir, ".env.b");
    fs.writeFileSync(src, "X=1\nY=2\n");
    fs.writeFileSync(tgt, "");

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const program = makeProgram();
    program.parse(["node", "test", "run", src, tgt, "--all"]);
    const content = fs.readFileSync(tgt, "utf8");
    expect(content).toContain("X=1");
    expect(content).toContain("Y=2");
    spy.mockRestore();
  });

  it("exits with error when no keys given", () => {
    const dir = makeTmpDir();
    const src = path.join(dir, ".env.a");
    const tgt = path.join(dir, ".env.b");
    fs.writeFileSync(src, "X=1\n");

    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const program = makeProgram();
    expect(() =>
      program.parse(["node", "test", "run", src, tgt])
    ).toThrow("exit");
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
