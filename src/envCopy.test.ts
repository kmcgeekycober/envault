import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { copyEnvKey, copyEnvKeyInFiles, formatCopyResult } from "./envCopy";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-copy-"));
}

describe("copyEnvKey", () => {
  it("copies a key into empty target", () => {
    const { updated, overwritten, skipped } = copyEnvKey("FOO", { FOO: "bar" }, {});
    expect(updated).toEqual({ FOO: "bar" });
    expect(overwritten).toBe(false);
    expect(skipped).toBe(false);
  });

  it("skips if key exists and overwrite is false", () => {
    const { updated, skipped } = copyEnvKey("FOO", { FOO: "new" }, { FOO: "old" }, false);
    expect(skipped).toBe(true);
    expect(updated.FOO).toBe("old");
  });

  it("overwrites if key exists and overwrite is true", () => {
    const { updated, overwritten, skipped } = copyEnvKey("FOO", { FOO: "new" }, { FOO: "old" }, true);
    expect(overwritten).toBe(true);
    expect(skipped).toBe(false);
    expect(updated.FOO).toBe("new");
  });
});

describe("copyEnvKeyInFiles", () => {
  let dir: string;

  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it("copies key from source to destination file", () => {
    const src = path.join(dir, ".env.src");
    const dst = path.join(dir, ".env.dst");
    fs.writeFileSync(src, "FOO=hello\nBAR=world\n");
    fs.writeFileSync(dst, "BAZ=other\n");

    const result = copyEnvKeyInFiles("FOO", src, dst);
    expect(result.skipped).toBe(false);
    expect(result.overwritten).toBe(false);
    const content = fs.readFileSync(dst, "utf8");
    expect(content).toContain("FOO=hello");
    expect(content).toContain("BAZ=other");
  });

  it("throws if source file does not exist", () => {
    expect(() => copyEnvKeyInFiles("FOO", path.join(dir, "missing"), path.join(dir, "dst")))
      .toThrow("Source file not found");
  });

  it("throws if key not in source", () => {
    const src = path.join(dir, ".env");
    fs.writeFileSync(src, "BAR=1\n");
    expect(() => copyEnvKeyInFiles("FOO", src, path.join(dir, "dst")))
      .toThrow('Key "FOO" not found');
  });

  it("creates destination file if it does not exist", () => {
    const src = path.join(dir, ".env.src");
    const dst = path.join(dir, ".env.dst");
    fs.writeFileSync(src, "TOKEN=abc\n");
    copyEnvKeyInFiles("TOKEN", src, dst);
    expect(fs.existsSync(dst)).toBe(true);
    expect(fs.readFileSync(dst, "utf8")).toContain("TOKEN=abc");
  });
});

describe("formatCopyResult", () => {
  it("formats a successful copy", () => {
    const msg = formatCopyResult({ key: "FOO", fromFile: "a", toFile: "b", overwritten: false, skipped: false });
    expect(msg).toContain("Copied");
    expect(msg).toContain("FOO");
  });

  it("formats an overwrite", () => {
    const msg = formatCopyResult({ key: "FOO", fromFile: "a", toFile: "b", overwritten: true, skipped: false });
    expect(msg).toContain("Overwrote");
  });

  it("formats a skip", () => {
    const msg = formatCopyResult({ key: "FOO", fromFile: "a", toFile: "b", overwritten: false, skipped: true });
    expect(msg).toContain("Skipped");
    expect(msg).toContain("--overwrite");
  });
});
