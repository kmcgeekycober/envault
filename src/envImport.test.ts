import { describe, it, expect } from "vitest";
import {
  parseImportSource,
  importEnvKeys,
  serializeEnv,
  formatImportResult,
} from "./envImport";

describe("parseImportSource", () => {
  it("parses simple key=value pairs", () => {
    const result = parseImportSource("FOO=bar\nBAZ=qux\n");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("strips quoted values", () => {
    const result = parseImportSource('KEY="hello world"\nOTHER=\'single\'');
    expect(result).toEqual({ KEY: "hello world", OTHER: "single" });
  });

  it("ignores comments and blank lines", () => {
    const result = parseImportSource("# comment\n\nFOO=1\n");
    expect(result).toEqual({ FOO: "1" });
  });

  it("ignores lines without equals sign", () => {
    const result = parseImportSource("NOEQUALS\nFOO=bar");
    expect(result).toEqual({ FOO: "bar" });
  });
});

describe("importEnvKeys", () => {
  const existing = { A: "1", B: "2" };
  const incoming = { B: "99", C: "3" };

  it("skips existing keys with skip strategy", () => {
    const { merged, result } = importEnvKeys(existing, incoming, "skip");
    expect(merged).toEqual({ A: "1", B: "2", C: "3" });
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.keys).toContain("C");
    expect(result.skippedKeys).toContain("B");
  });

  it("overwrites existing keys with overwrite strategy", () => {
    const { merged, result } = importEnvKeys(existing, incoming, "overwrite");
    expect(merged.B).toBe("99");
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it("does not mutate existing object", () => {
    importEnvKeys(existing, incoming, "overwrite");
    expect(existing.B).toBe("2");
  });
});

describe("serializeEnv", () => {
  it("serializes env record to dotenv format", () => {
    const output = serializeEnv({ FOO: "bar", BAZ: "1" });
    expect(output).toContain("FOO=bar");
    expect(output).toContain("BAZ=1");
    expect(output.endsWith("\n")).toBe(true);
  });
});

describe("formatImportResult", () => {
  it("formats result with imported and skipped counts", () => {
    const msg = formatImportResult({
      imported: 2,
      skipped: 1,
      keys: ["A", "C"],
      skippedKeys: ["B"],
    });
    expect(msg).toContain("Imported 2");
    expect(msg).toContain("skipped 1");
    expect(msg).toContain("A, C");
    expect(msg).toContain("B");
  });
});
