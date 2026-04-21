import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";
import { registerCacheCommands } from "./cacheCommand";
import { setCache } from "./cache";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-cachecmd-"));
}

function makeProgram(dir: string): Command {
  const program = new Command();
  program.exitOverride();
  registerCacheCommands(program);
  return program;
}

describe("cacheCommand", () => {
  it("set and get a cache value", () => {
    const dir = makeTmpDir();
    const program = makeProgram(dir);
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    program.parse(["node", "test", "cache", "set", "FOO", "bar", "--dir", dir]);
    program.parse(["node", "test", "cache", "get", "FOO", "--dir", dir]);
    expect(logs).toContain("bar");
    jest.restoreAllMocks();
  });

  it("get returns cache miss for unknown key", () => {
    const dir = makeTmpDir();
    const program = makeProgram(dir);
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    try {
      program.parse(["node", "test", "cache", "get", "UNKNOWN", "--dir", dir]);
    } catch {}
    expect(logs.some((l) => l.includes("Cache miss"))).toBe(true);
    mockExit.mockRestore();
    jest.restoreAllMocks();
  });

  it("delete removes a key", () => {
    const dir = makeTmpDir();
    setCache(dir, "DEL_KEY", "val");
    const program = makeProgram(dir);
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    program.parse(["node", "test", "cache", "delete", "DEL_KEY", "--dir", dir]);
    expect(logs.some((l) => l.includes("Deleted"))).toBe(true);
    jest.restoreAllMocks();
  });

  it("clear removes all entries", () => {
    const dir = makeTmpDir();
    setCache(dir, "A", "1");
    setCache(dir, "B", "2");
    const program = makeProgram(dir);
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    program.parse(["node", "test", "cache", "clear", "--dir", dir]);
    expect(logs.some((l) => l.includes("2"))).toBe(true);
    jest.restoreAllMocks();
  });

  it("list shows all keys", () => {
    const dir = makeTmpDir();
    setCache(dir, "LIST_A", "x");
    const program = makeProgram(dir);
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    program.parse(["node", "test", "cache", "list", "--dir", dir]);
    expect(logs.some((l) => l.includes("LIST_A"))).toBe(true);
    jest.restoreAllMocks();
  });

  it("prune removes expired entries", () => {
    const dir = makeTmpDir();
    setCache(dir, "EXP", "gone", -1);
    const program = makeProgram(dir);
    const logs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    program.parse(["node", "test", "cache", "prune", "--dir", dir]);
    expect(logs.some((l) => l.includes("1"))).toBe(true);
    jest.restoreAllMocks();
  });
});
