import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  promoteEnvKeys,
  promoteEnvFile,
  formatPromoteResult,
  PromoteResult,
} from "./envPromote";
import { parseEnvEntries } from "./env";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envpromote-"));
}

const sourceEntries = parseEnvEntries("A=1\nB=2\nC=3\n");
const targetEntries = parseEnvEntries("B=99\nD=4\n");

describe("promoteEnvKeys", () => {
  it("promotes new keys", () => {
    const { result } = promoteEnvKeys(sourceEntries, targetEntries, ["A"], false);
    expect(result.promoted).toContain("A");
    expect(result.skipped).toHaveLength(0);
  });

  it("skips existing keys without overwrite", () => {
    const { result } = promoteEnvKeys(sourceEntries, targetEntries, ["B"], false);
    expect(result.skipped).toContain("B");
    expect(result.promoted).toHaveLength(0);
  });

  it("overwrites existing keys with overwrite=true", () => {
    const { entries, result } = promoteEnvKeys(
      sourceEntries,
      targetEntries,
      ["B"],
      true
    );
    expect(result.overwritten).toContain("B");
    const b = entries.find((e) => e.key === "B");
    expect(b?.value).toBe("2");
  });

  it("skips keys not in source", () => {
    const { result } = promoteEnvKeys(sourceEntries, targetEntries, ["Z"], false);
    expect(result.skipped).toContain("Z");
  });
});

describe("promoteEnvFile", () => {
  it("writes promoted keys to target file", () => {
    const dir = makeTmpDir();
    const src = path.join(dir, ".env.staging");
    const tgt = path.join(dir, ".env.prod");
    fs.writeFileSync(src, "FOO=bar\nBAZ=qux\n");
    fs.writeFileSync(tgt, "EXISTING=yes\n");
    const result = promoteEnvFile(src, tgt, ["FOO"]);
    expect(result.promoted).toContain("FOO");
    const content = fs.readFileSync(tgt, "utf8");
    expect(content).toContain("FOO=bar");
    expect(content).toContain("EXISTING=yes");
  });

  it("creates target if it does not exist", () => {
    const dir = makeTmpDir();
    const src = path.join(dir, ".env.a");
    const tgt = path.join(dir, ".env.b");
    fs.writeFileSync(src, "KEY=val\n");
    const result = promoteEnvFile(src, tgt, ["KEY"]);
    expect(result.promoted).toContain("KEY");
    expect(fs.existsSync(tgt)).toBe(true);
  });
});

describe("formatPromoteResult", () => {
  it("formats promoted and skipped", () => {
    const result: PromoteResult = {
      promoted: ["A"],
      skipped: ["B"],
      overwritten: [],
    };
    const out = formatPromoteResult(result, "src", "tgt");
    expect(out).toContain("Promoted");
    expect(out).toContain("Skipped");
    expect(out).toContain("src → tgt");
  });

  it("shows no keys promoted message", () => {
    const result: PromoteResult = { promoted: [], skipped: ["X"], overwritten: [] };
    const out = formatPromoteResult(result, "a", "b");
    expect(out).toContain("No keys promoted");
  });
});
