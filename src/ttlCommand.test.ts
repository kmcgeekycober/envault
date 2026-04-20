import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerTtlCommands } from "./ttlCommand";
import { setTtl, getTtlPath } from "./ttl";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-ttlcmd-"));
}

function makeProgram(cwd: string): Command {
  const program = new Command();
  program.exitOverride();
  jest.spyOn(process, "cwd").mockReturnValue(cwd);
  registerTtlCommands(program);
  return program;
}

describe("ttlCommand", () => {
  let dir: string;
  let program: Command;
  let output: string[];

  beforeEach(() => {
    dir = makeTmpDir();
    program = makeProgram(dir);
    output = [];
    jest.spyOn(console, "log").mockImplementation((msg) => output.push(msg));
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it("set adds a TTL entry", () => {
    program.parse(["node", "test", "ttl", "set", "MY_KEY", "120"]);
    expect(output[0]).toMatch(/TTL set/);
    expect(output[0]).toMatch(/MY_KEY/);
  });

  it("remove removes a TTL entry", () => {
    setTtl(dir, ".env", "MY_KEY", 60);
    program.parse(["node", "test", "ttl", "remove", "MY_KEY"]);
    expect(output[0]).toMatch(/removed/);
  });

  it("remove reports missing entry", () => {
    program.parse(["node", "test", "ttl", "remove", "GHOST"]);
    expect(output[0]).toMatch(/No TTL found/);
  });

  it("list shows entries", () => {
    setTtl(dir, ".env", "TOKEN", 300);
    program.parse(["node", "test", "ttl", "list"]);
    expect(output.some((l) => l.includes("TOKEN"))).toBe(true);
  });

  it("list shows empty message when no entries", () => {
    program.parse(["node", "test", "ttl", "list"]);
    expect(output[0]).toMatch(/No TTL entries/);
  });

  it("expired shows expired keys", () => {
    const config = {
      entries: [{ key: "OLD_TOKEN", file: ".env", expiresAt: Date.now() - 1000 }],
    };
    const p = getTtlPath(dir);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(config));
    program.parse(["node", "test", "ttl", "expired"]);
    expect(output.some((l) => l.includes("OLD_TOKEN"))).toBe(true);
  });

  it("expired shows no expired message when none", () => {
    program.parse(["node", "test", "ttl", "expired"]);
    expect(output[0]).toMatch(/No expired/);
  });
});
