import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { compareEnvFiles, formatCompareResult } from "./envCompare";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-compare-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

describe("compareEnvFiles", () => {
  it("detects matching keys", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\nBAZ=qux\n");
    const b = writeEnv(dir, ".env.b", "FOO=bar\nBAZ=qux\n");
    const result = compareEnvFiles(a, b);
    expect(result.matchCount).toBe(2);
    expect(result.mismatchCount).toBe(0);
  });

  it("detects mismatched values", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const b = writeEnv(dir, ".env.b", "FOO=baz\n");
    const result = compareEnvFiles(a, b);
    expect(result.mismatchCount).toBe(1);
    expect(result.entries[0].status).toBe("mismatch");
  });

  it("detects left-only keys", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\nEXTRA=1\n");
    const b = writeEnv(dir, ".env.b", "FOO=bar\n");
    const result = compareEnvFiles(a, b);
    expect(result.leftOnlyCount).toBe(1);
    const extra = result.entries.find((e) => e.key === "EXTRA");
    expect(extra?.status).toBe("left-only");
  });

  it("detects right-only keys", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const b = writeEnv(dir, ".env.b", "FOO=bar\nNEW=1\n");
    const result = compareEnvFiles(a, b);
    expect(result.rightOnlyCount).toBe(1);
  });

  it("handles missing files gracefully", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const result = compareEnvFiles(a, path.join(dir, "nonexistent"));
    expect(result.leftOnlyCount).toBe(1);
    expect(result.rightOnlyCount).toBe(0);
  });
});

describe("formatCompareResult", () => {
  it("includes summary line", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const b = writeEnv(dir, ".env.b", "FOO=baz\n");
    const result = compareEnvFiles(a, b);
    const output = formatCompareResult(result, "dev", "prod");
    expect(output).toContain("[dev]");
    expect(output).toContain("[prod]");
    expect(output).toContain("1 mismatch");
  });

  it("marks matching keys with =", () => {
    const dir = makeTmpDir();
    const a = writeEnv(dir, ".env.a", "FOO=bar\n");
    const b = writeEnv(dir, ".env.b", "FOO=bar\n");
    const result = compareEnvFiles(a, b);
    const output = formatCompareResult(result);
    expect(output).toContain("= FOO");
  });
});
