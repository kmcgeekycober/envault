import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseEnvEntries,
  serializeEnvEntries,
  readEnvFile,
  writeEnvFile,
  getEnvValue,
  setEnvValue,
  deleteEnvKey,
} from "./env";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-env-test-"));
}

describe("parseEnvEntries", () => {
  it("parses simple key=value pairs", () => {
    const entries = parseEnvEntries("FOO=bar\nBAZ=qux");
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: "FOO", value: "bar", comment: undefined });
  });

  it("strips surrounding quotes from values", () => {
    const entries = parseEnvEntries('KEY="hello world"');
    expect(entries[0].value).toBe("hello world");
  });

  it("attaches preceding comment to entry", () => {
    const entries = parseEnvEntries("# my comment\nKEY=val");
    expect(entries[0].comment).toBe("my comment");
  });

  it("ignores blank lines", () => {
    const entries = parseEnvEntries("A=1\n\nB=2");
    expect(entries).toHaveLength(2);
  });
});

describe("serializeEnvEntries", () => {
  it("round-trips entries", () => {
    const entries = parseEnvEntries("FOO=bar\nBAZ=qux");
    const out = serializeEnvEntries(entries);
    expect(out).toContain("FOO=bar");
    expect(out).toContain("BAZ=qux");
  });

  it("quotes values containing spaces", () => {
    const out = serializeEnvEntries([{ key: "K", value: "hello world" }]);
    expect(out).toContain('K="hello world"');
  });
});

describe("readEnvFile / writeEnvFile", () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it("returns empty entries for missing file", () => {
    const ef = readEnvFile(path.join(tmpDir, ".env"));
    expect(ef.entries).toHaveLength(0);
  });

  it("writes and reads back entries", () => {
    const filePath = path.join(tmpDir, ".env");
    const ef = { path: filePath, entries: [{ key: "X", value: "42" }] };
    writeEnvFile(ef);
    const read = readEnvFile(filePath);
    expect(getEnvValue(read, "X")).toBe("42");
  });
});

describe("setEnvValue / deleteEnvKey", () => {
  it("adds a new key", () => {
    const ef = { path: ".env", entries: [] };
    const updated = setEnvValue(ef, "NEW", "value");
    expect(getEnvValue(updated, "NEW")).toBe("value");
  });

  it("updates an existing key", () => {
    const ef = { path: ".env", entries: [{ key: "A", value: "old" }] };
    const updated = setEnvValue(ef, "A", "new");
    expect(getEnvValue(updated, "A")).toBe("new");
  });

  it("deletes a key", () => {
    const ef = { path: ".env", entries: [{ key: "DEL", value: "x" }] };
    const updated = deleteEnvKey(ef, "DEL");
    expect(getEnvValue(updated, "DEL")).toBeUndefined();
  });
});
