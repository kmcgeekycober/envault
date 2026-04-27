import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  replaceEnvValue,
  replaceEnvValues,
  replaceEnvInFile,
  formatReplaceResult,
} from "./envReplace";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envreplace-"));
}

describe("replaceEnvValue", () => {
  it("replaces an existing key", () => {
    const entries = { FOO: "bar", BAZ: "qux" };
    const result = replaceEnvValue(entries, "FOO", "newbar");
    expect(result.replaced).toBe(true);
    expect(result.oldValue).toBe("bar");
    expect(result.newValue).toBe("newbar");
    expect(entries.FOO).toBe("newbar");
  });

  it("returns replaced=false for missing key", () => {
    const entries = { FOO: "bar" };
    const result = replaceEnvValue(entries, "MISSING", "val");
    expect(result.replaced).toBe(false);
    expect(result.oldValue).toBe("");
  });
});

describe("replaceEnvValues", () => {
  it("replaces multiple keys", () => {
    const entries = { A: "1", B: "2", C: "3" };
    const results = replaceEnvValues(entries, { A: "10", C: "30" });
    expect(results).toHaveLength(2);
    expect(results[0].replaced).toBe(true);
    expect(entries.A).toBe("10");
    expect(entries.C).toBe("30");
  });
});

describe("replaceEnvInFile", () => {
  it("writes replacements to file", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, ".env");
    fs.writeFileSync(file, "FOO=old\nBAR=keep\n");
    const result = replaceEnvInFile(file, { FOO: "new" });
    expect(result.totalReplaced).toBe(1);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("FOO=new");
    expect(content).toContain("BAR=keep");
  });

  it("does not write file when no keys match", () => {
    const dir = makeTmpDir();
    const file = path.join(dir, ".env");
    fs.writeFileSync(file, "FOO=old\n");
    const before = fs.statSync(file).mtimeMs;
    const result = replaceEnvInFile(file, { MISSING: "val" });
    const after = fs.statSync(file).mtimeMs;
    expect(result.totalReplaced).toBe(0);
    expect(after).toBe(before);
  });
});

describe("formatReplaceResult", () => {
  it("formats replaced and missing keys", () => {
    const result = {
      filePath: ".env",
      totalReplaced: 1,
      results: [
        { key: "FOO", oldValue: "bar", newValue: "baz", replaced: true },
        { key: "MISSING", oldValue: "", newValue: "x", replaced: false },
      ],
    };
    const out = formatReplaceResult(result);
    expect(out).toContain("✔ FOO");
    expect(out).toContain("✘ MISSING");
    expect(out).toContain("1 replacement(s) made.");
  });
});
