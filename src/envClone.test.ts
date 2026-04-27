import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { cloneEnvFile, formatCloneResult } from "./envClone";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-clone-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

describe("cloneEnvFile", () => {
  it("clones all keys to a new file", () => {
    const dir = makeTmpDir();
    const src = writeEnv(dir, ".env", "FOO=bar\nBAZ=qux\n");
    const dest = path.join(dir, ".env.clone");

    const result = cloneEnvFile(src, dest);

    expect(result.cloned).toEqual(expect.arrayContaining(["FOO", "BAZ"]));
    expect(result.skipped).toHaveLength(0);
    expect(result.overwritten).toHaveLength(0);
    expect(fs.readFileSync(dest, "utf-8")).toContain("FOO=bar");
  });

  it("skips existing keys when overwrite is false", () => {
    const dir = makeTmpDir();
    const src = writeEnv(dir, ".env", "FOO=new\nBAR=val\n");
    const dest = writeEnv(dir, ".env.dest", "FOO=old\n");

    const result = cloneEnvFile(src, dest, { overwrite: false });

    expect(result.skipped).toContain("FOO");
    expect(result.cloned).toContain("BAR");
    expect(fs.readFileSync(dest, "utf-8")).toContain("FOO=old");
  });

  it("overwrites existing keys when overwrite is true", () => {
    const dir = makeTmpDir();
    const src = writeEnv(dir, ".env", "FOO=new\n");
    const dest = writeEnv(dir, ".env.dest", "FOO=old\n");

    const result = cloneEnvFile(src, dest, { overwrite: true });

    expect(result.overwritten).toContain("FOO");
    expect(fs.readFileSync(dest, "utf-8")).toContain("FOO=new");
  });

  it("clones only specified keys", () => {
    const dir = makeTmpDir();
    const src = writeEnv(dir, ".env", "FOO=1\nBAR=2\nBAZ=3\n");
    const dest = path.join(dir, ".env.partial");

    const result = cloneEnvFile(src, dest, { keys: ["FOO", "BAZ"] });

    expect(result.cloned).toEqual(expect.arrayContaining(["FOO", "BAZ"]));
    expect(result.cloned).not.toContain("BAR");
  });

  it("excludes specified keys", () => {
    const dir = makeTmpDir();
    const src = writeEnv(dir, ".env", "FOO=1\nSECRET=s3cr3t\n");
    const dest = path.join(dir, ".env.safe");

    const result = cloneEnvFile(src, dest, { exclude: ["SECRET"] });

    expect(result.cloned).toContain("FOO");
    expect(result.cloned).not.toContain("SECRET");
    expect(fs.readFileSync(dest, "utf-8")).not.toContain("SECRET");
  });
});

describe("formatCloneResult", () => {
  it("formats a clone result summary", () => {
    const result = {
      source: ".env",
      destination: ".env.clone",
      cloned: ["FOO", "BAR"],
      skipped: ["EXISTING"],
      overwritten: [],
    };
    const output = formatCloneResult(result);
    expect(output).toContain(".env → .env.clone");
    expect(output).toContain("2 key(s)");
    expect(output).toContain("Skipped");
  });
});
