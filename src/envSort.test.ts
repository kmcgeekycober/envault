import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { sortEnvEntries, sortEnvFile, formatSortResult } from "./envSort";
import { EnvEntry } from "./env";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-sort-"));
}

const entries: EnvEntry[] = [
  { key: "ZEBRA", value: "1" },
  { key: "APPLE", value: "2" },
  { key: "MANGO", value: "3" },
];

describe("sortEnvEntries", () => {
  it("sorts by key ascending", () => {
    const result = sortEnvEntries(entries, { by: "key", order: "asc" });
    expect(result.map((e) => e.key)).toEqual(["APPLE", "MANGO", "ZEBRA"]);
  });

  it("sorts by key descending", () => {
    const result = sortEnvEntries(entries, { by: "key", order: "desc" });
    expect(result.map((e) => e.key)).toEqual(["ZEBRA", "MANGO", "APPLE"]);
  });

  it("sorts by length", () => {
    const result = sortEnvEntries(entries, { by: "length", order: "asc" });
    expect(result[0].key).toBe("ZEBRA");
  });

  it("groups comments at top", () => {
    const withComment: EnvEntry[] = [
      { key: "ZEBRA", value: "1" },
      { key: undefined, value: "# comment" },
      { key: "APPLE", value: "2" },
    ];
    const result = sortEnvEntries(withComment, { groupComments: true });
    expect(result[0].key).toBeUndefined();
  });
});

describe("sortEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("detects changed keys", () => {
    const file = path.join(tmpDir, ".env");
    fs.writeFileSync(file, "ZEBRA=1\nAPPLE=2\nMANGO=3\n");
    const result = sortEnvFile(file);
    expect(result.changed).toBe(true);
    expect(result.movedKeys.length).toBeGreaterThan(0);
  });

  it("reports no change when already sorted", () => {
    const file = path.join(tmpDir, ".env");
    fs.writeFileSync(file, "APPLE=2\nMANGO=3\nZEBRA=1\n");
    const result = sortEnvFile(file);
    expect(result.changed).toBe(false);
  });
});

describe("formatSortResult", () => {
  it("shows no-change message", () => {
    const msg = formatSortResult({ original: [], sorted: [], changed: false, movedKeys: [] });
    expect(msg).toContain("Already sorted");
  });

  it("lists moved keys", () => {
    const msg = formatSortResult({
      original: [],
      sorted: [],
      changed: true,
      movedKeys: ["ZEBRA", "APPLE"],
    });
    expect(msg).toContain("ZEBRA");
    expect(msg).toContain("APPLE");
  });
});
