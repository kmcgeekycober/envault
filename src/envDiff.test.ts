import { diffEnvEntries, diffEnvFiles, formatEnvDiffResult } from "./envDiff";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envdiff-test-"));
}

describe("diffEnvEntries", () => {
  it("detects added keys", () => {
    const result = diffEnvEntries({ A: "1" }, { A: "1", B: "2" });
    expect(result.added).toBe(1);
    expect(result.entries[0]).toMatchObject({ key: "B", type: "added", newValue: "2" });
  });

  it("detects removed keys", () => {
    const result = diffEnvEntries({ A: "1", B: "2" }, { A: "1" });
    expect(result.removed).toBe(1);
    expect(result.entries[0]).toMatchObject({ key: "B", type: "removed", oldValue: "2" });
  });

  it("detects changed keys", () => {
    const result = diffEnvEntries({ A: "1" }, { A: "2" });
    expect(result.changed).toBe(1);
    expect(result.entries[0]).toMatchObject({ key: "A", type: "changed", oldValue: "1", newValue: "2" });
  });

  it("returns empty result for identical envs", () => {
    const result = diffEnvEntries({ A: "1", B: "2" }, { A: "1", B: "2" });
    expect(result.entries).toHaveLength(0);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.changed).toBe(0);
  });

  it("sorts entries by key", () => {
    const result = diffEnvEntries({}, { Z: "1", A: "2", M: "3" });
    expect(result.entries.map((e) => e.key)).toEqual(["A", "M", "Z"]);
  });
});

describe("diffEnvFiles", () => {
  it("diffs two env files on disk", () => {
    const dir = makeTmpDir();
    const base = path.join(dir, ".env.base");
    const target = path.join(dir, ".env.target");
    fs.writeFileSync(base, "A=1\nB=2\n");
    fs.writeFileSync(target, "A=1\nC=3\n");
    const result = diffEnvFiles(base, target);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.changed).toBe(0);
  });

  it("treats missing base file as empty", () => {
    const dir = makeTmpDir();
    const target = path.join(dir, ".env");
    fs.writeFileSync(target, "X=10\n");
    const result = diffEnvFiles(path.join(dir, ".env.missing"), target);
    expect(result.added).toBe(1);
  });
});

describe("formatEnvDiffResult", () => {
  it("returns no-diff message when empty", () => {
    const result = { entries: [], added: 0, removed: 0, changed: 0 };
    expect(formatEnvDiffResult(result)).toBe("No differences found.");
  });

  it("formats added, removed, changed entries", () => {
    const result = diffEnvEntries({ A: "1", B: "old" }, { B: "new", C: "3" });
    const output = formatEnvDiffResult(result);
    expect(output).toContain("+ C=3");
    expect(output).toContain("- A=1");
    expect(output).toContain("~ B: old -> new");
    expect(output).toContain("Summary:");
  });

  it("masks values when requested", () => {
    const result = diffEnvEntries({}, { SECRET: "hunter2" });
    const output = formatEnvDiffResult(result, true);
    expect(output).toContain("***");
    expect(output).not.toContain("hunter2");
  });
});
