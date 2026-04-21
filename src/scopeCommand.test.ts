import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addScope, getScopePath } from "./scope";
import { registerScopeCommands } from "./scopeCommand";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-scopecmd-"));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerScopeCommands(program);
  return program;
}

describe("scopeCommand", () => {
  let tmpDir: string;
  let logs: string[];
  let errors: string[];

  beforeEach(() => {
    tmpDir = makeTmpDir();
    logs = [];
    errors = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    jest.spyOn(console, "error").mockImplementation((msg) => errors.push(msg));
    jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    jest.spyOn(require("./scope"), "addScope").mockImplementation(
      (name: string, keys: string[]) => require("./scope").addScope.call(null, name, keys, tmpDir)
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("registers scope subcommands", () => {
    const program = makeProgram();
    const names = program.commands.find((c) => c.name() === "scope")?.commands.map((c) => c.name());
    expect(names).toEqual(expect.arrayContaining(["add", "remove", "list", "show"]));
  });

  it("add command prints confirmation", () => {
    const scopeMod = require("./scope");
    jest.spyOn(scopeMod, "addScope").mockReturnValue({ scopes: { backend: ["DB_URL"] } });
    const program = makeProgram();
    program.parse(["node", "envault", "scope", "add", "backend", "DB_URL"]);
    expect(logs.some((l) => l.includes("backend"))).toBe(true);
  });

  it("list command prints no scopes when empty", () => {
    const scopeMod = require("./scope");
    jest.spyOn(scopeMod, "listScopes").mockReturnValue([]);
    const program = makeProgram();
    program.parse(["node", "envault", "scope", "list"]);
    expect(logs.some((l) => l.includes("No scopes"))).toBe(true);
  });

  it("show command errors on missing scope", () => {
    const scopeMod = require("./scope");
    jest.spyOn(scopeMod, "getScope").mockImplementation(() => { throw new Error("does not exist"); });
    const program = makeProgram();
    expect(() => program.parse(["node", "envault", "scope", "show", "ghost"])).toThrow();
    expect(errors.some((e) => e.includes("Error"))).toBe(true);
  });
});
