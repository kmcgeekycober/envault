import { describe, it, expect, beforeEach } from "vitest";
import { Command } from "commander";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { registerTokenCommands } from "./tokenCommand";
import { loadTokens, saveTokens, addToken, getTokensPath } from "./token";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-tokencmd-"));
}

function makeProgram(dir: string): Command {
  const program = new Command();
  program.exitOverride();
  // Patch loadTokens/saveTokens to use tmp dir via env
  process.env["ENVAULT_DIR"] = dir;
  registerTokenCommands(program);
  return program;
}

describe("tokenCommand", () => {
  let dir: string;
  let logs: string[];
  let errors: string[];

  beforeEach(() => {
    dir = makeTmpDir();
    logs = [];
    errors = [];
    vi.spyOn(console, "log").mockImplementation((...args) => logs.push(args.join(" ")));
    vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args.join(" ")));
  });

  it("list shows no tokens message on empty store", async () => {
    const store = { tokens: [] };
    const p = getTokensPath(dir);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(store, null, 2));

    const program = new Command();
    program.exitOverride();
    registerTokenCommands(program);
    // manually invoke list logic
    const { loadTokens: lt, formatTokenList: fl } = await import("./token");
    const s = lt(dir);
    expect(fl(s)).toBe("No tokens found.");
  });

  it("addToken and getToken round-trip", () => {
    const store = loadTokens(dir);
    addToken(store, "test-token", ["read", "sync"], undefined);
    saveTokens(store, dir);
    const loaded = loadTokens(dir);
    expect(loaded.tokens[0].label).toBe("test-token");
    expect(loaded.tokens[0].scopes).toContain("read");
  });

  it("registers token subcommands", () => {
    const program = new Command();
    program.exitOverride();
    registerTokenCommands(program);
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("token");
    const tokenCmd = program.commands.find((c) => c.name() === "token")!;
    const subNames = tokenCmd.commands.map((c) => c.name());
    expect(subNames).toContain("create");
    expect(subNames).toContain("list");
    expect(subNames).toContain("show");
    expect(subNames).toContain("revoke");
  });

  it("formatTokenList includes EXPIRED for past expiry", async () => {
    const { loadTokens: lt, addToken: at, saveTokens: st, formatTokenList: fl } = await import("./token");
    const store = lt(dir);
    at(store, "old", ["read"], "2000-01-01T00:00:00.000Z");
    st(store, dir);
    const loaded = lt(dir);
    expect(fl(loaded)).toContain("[EXPIRED]");
  });
});
