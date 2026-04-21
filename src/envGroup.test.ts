import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addGroup, removeGroup, listGroups, getGroup, formatGroups, loadGroups } from "./envGroup";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-group-"));
}

describe("envGroup", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("starts with empty groups", () => {
    const config = loadGroups(tmpDir);
    expect(config.groups).toEqual([]);
  });

  it("adds a new group", () => {
    const g = addGroup("database", ["DB_HOST", "DB_PORT"], "Database vars", tmpDir);
    expect(g.name).toBe("database");
    expect(g.keys).toContain("DB_HOST");
    expect(g.description).toBe("Database vars");
  });

  it("merges keys into existing group", () => {
    addGroup("database", ["DB_HOST"], undefined, tmpDir);
    const updated = addGroup("database", ["DB_PORT", "DB_HOST"], undefined, tmpDir);
    expect(updated.keys).toEqual(["DB_HOST", "DB_PORT"]);
  });

  it("removes a group", () => {
    addGroup("cache", ["REDIS_URL"], undefined, tmpDir);
    const removed = removeGroup("cache", tmpDir);
    expect(removed).toBe(true);
    expect(listGroups(tmpDir)).toHaveLength(0);
  });

  it("returns false when removing non-existent group", () => {
    const removed = removeGroup("ghost", tmpDir);
    expect(removed).toBe(false);
  });

  it("gets a group by name", () => {
    addGroup("auth", ["JWT_SECRET"], "Auth vars", tmpDir);
    const found = getGroup("auth", tmpDir);
    expect(found).toBeDefined();
    expect(found?.keys).toContain("JWT_SECRET");
  });

  it("returns undefined for unknown group", () => {
    expect(getGroup("unknown", tmpDir)).toBeUndefined();
  });

  it("formats groups as readable string", () => {
    addGroup("infra", ["AWS_KEY", "AWS_SECRET"], "AWS vars", tmpDir);
    const output = formatGroups(listGroups(tmpDir));
    expect(output).toContain("[infra]");
    expect(output).toContain("AWS_KEY");
    expect(output).toContain("AWS vars");
  });

  it("formats empty groups list", () => {
    expect(formatGroups([])).toBe("No groups defined.");
  });
});
