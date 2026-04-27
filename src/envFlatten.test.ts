import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  flattenEnvKey,
  flattenEnvEntries,
  flattenEnvFile,
  formatFlattenResult,
} from "./envFlatten";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envflatten-"));
}

describe("flattenEnvKey", () => {
  it("uppercases keys by default", () => {
    expect(flattenEnvKey("my.key")).toBe("MY_KEY");
  });

  it("replaces special characters with separator", () => {
    expect(flattenEnvKey("my-key.name", { separator: "_" })).toBe("MY_KEY_NAME");
  });

  it("prepends prefix when provided", () => {
    expect(flattenEnvKey("key", { prefix: "APP" })).toBe("APP_KEY");
  });

  it("preserves casing when uppercase is false", () => {
    expect(flattenEnvKey("myKey", { uppercase: false })).toBe("myKey");
  });
});

describe("flattenEnvEntries", () => {
  it("flattens entries and returns count", () => {
    const result = flattenEnvEntries({ "db.host": "localhost", "db.port": "5432" });
    expect(result.flattened["DB_HOST"]).toBe("localhost");
    expect(result.flattened["DB_PORT"]).toBe("5432");
    expect(result.count).toBe(2);
  });

  it("tracks skipped keys on collision", () => {
    const result = flattenEnvEntries({ "db.host": "localhost", "db-host": "other" });
    expect(result.skipped).toHaveLength(1);
    expect(result.count).toBe(1);
  });

  it("applies prefix to all keys", () => {
    const result = flattenEnvEntries({ host: "localhost" }, { prefix: "APP" });
    expect(result.flattened["APP_HOST"]).toBe("localhost");
  });
});

describe("flattenEnvFile", () => {
  it("reads and flattens a .env file", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, ".env");
    fs.writeFileSync(file, "db.host=localhost\ndb.port=5432\n# comment\n");
    const result = flattenEnvFile(file);
    expect(result.flattened["DB_HOST"]).toBe("localhost");
    expect(result.flattened["DB_PORT"]).toBe("5432");
    expect(result.count).toBe(2);
  });

  it("strips quotes from values", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, ".env");
    fs.writeFileSync(file, 'KEY="some value"\n');
    const result = flattenEnvFile(file);
    expect(result.flattened["KEY"]).toBe("some value");
  });
});

describe("formatFlattenResult", () => {
  it("formats result with no skipped keys", () => {
    const out = formatFlattenResult({ original: {}, flattened: { A: "1" }, count: 1, skipped: [] });
    expect(out).toContain("1 key(s)");
    expect(out).not.toContain("Skipped");
  });

  it("includes skipped keys in output", () => {
    const out = formatFlattenResult({ original: {}, flattened: {}, count: 0, skipped: ["x"] });
    expect(out).toContain("Skipped");
    expect(out).toContain("x");
  });
});
