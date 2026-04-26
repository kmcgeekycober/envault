import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerEnvSortCommands } from "./envSortCommand";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-sortcmd-"));
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerEnvSortCommands(program);
  return program;
}

describe("registerEnvSortCommands", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("reports already sorted", () => {
    const file = path.join(tmpDir, ".env");
    fs.writeFileSync(file, "ALPHA=1\nBETA=2\n");
    const program = makeProgram();
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((m) => logs.push(m));
    program.parse(["node", "envault", "sort", file]);
    expect(logs.join(" ")).toContain("Already sorted");
  });

  it("writes sorted file when --write is passed", () => {
    const file = path.join(tmpDir, ".env");
    fs.writeFileSync(file, "ZEBRA=1\nAPPLE=2\n");
    const program = makeProgram();
    vi.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "envault", "sort", file, "--write"]);
    const content = fs.readFileSync(file, "utf8");
    expect(content.indexOf("APPLE")).toBeLessThan(content.indexOf("ZEBRA"));
  });

  it("does not write on dry-run", () => {
    const file = path.join(tmpDir, ".env");
    const original = "ZEBRA=1\nAPPLE=2\n";
    fs.writeFileSync(file, original);
    const program = makeProgram();
    vi.spyOn(console, "log").mockImplementation(() => {});
    program.parse(["node", "envault", "sort", file, "--write", "--dry-run"]);
    expect(fs.readFileSync(file, "utf8")).toBe(original);
  });

  it("exits on missing file", () => {
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() =>
      program.parse(["node", "envault", "sort", "/nonexistent/.env"])
    ).toThrow();
    exitSpy.mockRestore();
  });
});
