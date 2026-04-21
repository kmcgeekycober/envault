import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  addScope,
  removeScope,
  getScope,
  filterEnvByScope,
  listScopes,
  loadScopes,
} from "./scope";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-scope-"));
}

describe("scope", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loads empty config when no file exists", () => {
    const config = loadScopes(tmpDir);
    expect(config.scopes).toEqual({});
  });

  it("adds a scope with keys", () => {
    addScope("backend", ["DB_URL", "DB_PASS"], tmpDir);
    const keys = getScope("backend", tmpDir);
    expect(keys).toContain("DB_URL");
    expect(keys).toContain("DB_PASS");
  });

  it("merges keys when adding to existing scope", () => {
    addScope("backend", ["DB_URL"], tmpDir);
    addScope("backend", ["DB_PASS"], tmpDir);
    const keys = getScope("backend", tmpDir);
    expect(keys).toEqual(expect.arrayContaining(["DB_URL", "DB_PASS"]));
  });

  it("deduplicates keys", () => {
    addScope("backend", ["DB_URL", "DB_URL"], tmpDir);
    const keys = getScope("backend", tmpDir);
    expect(keys.filter((k) => k === "DB_URL").length).toBe(1);
  });

  it("removes a scope", () => {
    addScope("frontend", ["API_URL"], tmpDir);
    removeScope("frontend", tmpDir);
    expect(listScopes(tmpDir)).not.toContain("frontend");
  });

  it("throws when removing nonexistent scope", () => {
    expect(() => removeScope("ghost", tmpDir)).toThrow();
  });

  it("lists all scopes", () => {
    addScope("backend", ["DB_URL"], tmpDir);
    addScope("frontend", ["API_URL"], tmpDir);
    expect(listScopes(tmpDir)).toEqual(expect.arrayContaining(["backend", "frontend"]));
  });

  it("filters env by scope keys", () => {
    const env = { DB_URL: "postgres://", API_KEY: "secret", PORT: "3000" };
    const result = filterEnvByScope(env, ["DB_URL", "PORT"]);
    expect(result).toEqual({ DB_URL: "postgres://", PORT: "3000" });
    expect(result).not.toHaveProperty("API_KEY");
  });
});
