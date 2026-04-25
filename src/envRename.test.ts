import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renameEnvKey, renameEnvKeyInFile, formatRenameResult } from "./envRename";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-rename-"));
}

describe("renameEnvKey", () => {
  it("renames an existing key", () => {
    const entries = { FOO: "bar", BAZ: "qux" };
    const { entries: updated, result } = renameEnvKey(entries, "FOO", "FOO_NEW");
    expect(result.success).toBe(true);
    expect(updated["FOO_NEW"]).toBe("bar");
    expect(updated["FOO"]).toBeUndefined();
    expect(updated["BAZ"]).toBe("qux");
  });

  it("preserves insertion order", () => {
    const entries = { A: "1", B: "2", C: "3" };
    const { entries: updated } = renameEnvKey(entries, "B", "B_NEW");
    expect(Object.keys(updated)).toEqual(["A", "B_NEW", "C"]);
  });

  it("returns failure when old key missing", () => {
    const entries = { FOO: "bar" };
    const { result } = renameEnvKey(entries, "MISSING", "NEW");
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/not found/);
  });

  it("returns failure when new key already exists", () => {
    const entries = { FOO: "bar", BAZ: "qux" };
    const { result } = renameEnvKey(entries, "FOO", "BAZ");
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/already exists/);
  });
});

describe("renameEnvKeyInFile", () => {
  it("renames a key in a real file", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, ".env");
    fs.writeFileSync(file, "FOO=bar\nBAZ=qux\n");
    const result = renameEnvKeyInFile(file, "FOO", "FOO_RENAMED");
    expect(result.success).toBe(true);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("FOO_RENAMED=bar");
    expect(content).not.toContain("FOO=bar");
    expect(content).toContain("BAZ=qux");
  });

  it("returns failure for missing file", () => {
    const result = renameEnvKeyInFile("/nonexistent/.env", "FOO", "BAR");
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/File not found/);
  });

  it("preserves comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, ".env");
    fs.writeFileSync(file, "# comment\nFOO=bar\n\nBAZ=qux\n");
    renameEnvKeyInFile(file, "FOO", "FOO_NEW");
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("# comment");
    expect(content).toContain("FOO_NEW=bar");
  });
});

describe("formatRenameResult", () => {
  it("formats success", () => {
    const msg = formatRenameResult({ oldKey: "A", newKey: "B", success: true });
    expect(msg).toMatch(/Renamed/);
    expect(msg).toContain("A");
    expect(msg).toContain("B");
  });

  it("formats failure", () => {
    const msg = formatRenameResult({ oldKey: "A", newKey: "B", success: false, reason: "not found" });
    expect(msg).toMatch(/failed/);
    expect(msg).toContain("not found");
  });
});
