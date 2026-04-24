import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { getEnvStatus, formatEnvStatus } from "./envStatus";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-status-"));
}

describe("getEnvStatus", () => {
  it("returns status for a simple env file", async () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, ".env");
    fs.writeFileSync(envFile, "FOO=bar\nBAR=\n");
    const result = await getEnvStatus(envFile, dir);
    expect(result.totalKeys).toBe(2);
    expect(result.missingRequired).toBe(0);
    expect(result.expiredTtl).toBe(0);
    const foo = result.entries.find((e) => e.key === "FOO");
    expect(foo?.hasValue).toBe(true);
    const bar = result.entries.find((e) => e.key === "BAR");
    expect(bar?.hasValue).toBe(false);
  });

  it("returns empty result for missing env file", async () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, ".env");
    const result = await getEnvStatus(envFile, dir);
    expect(result.totalKeys).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it("marks required keys from schema", async () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, ".env");
    fs.writeFileSync(envFile, "SECRET=\n");
    const schemaPath = path.join(dir, "schema.json");
    fs.writeFileSync(
      schemaPath,
      JSON.stringify({ fields: { SECRET: { required: true, type: "string" } } })
    );
    const result = await getEnvStatus(envFile, dir);
    expect(result.missingRequired).toBe(1);
    const secret = result.entries.find((e) => e.key === "SECRET");
    expect(secret?.isRequired).toBe(true);
    expect(secret?.hasValue).toBe(false);
  });

  it("marks pinned keys", async () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, ".env");
    fs.writeFileSync(envFile, "API_KEY=abc\n");
    const pinsPath = path.join(dir, "pins.json");
    fs.writeFileSync(pinsPath, JSON.stringify({ keys: ["API_KEY"] }));
    const result = await getEnvStatus(envFile, dir);
    expect(result.pinnedKeys).toBe(1);
    const apiKey = result.entries.find((e) => e.key === "API_KEY");
    expect(apiKey?.isPinned).toBe(true);
  });
});

describe("formatEnvStatus", () => {
  it("formats status output with flags", async () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, ".env");
    fs.writeFileSync(envFile, "FOO=bar\n");
    const result = await getEnvStatus(envFile, dir);
    const output = formatEnvStatus(result);
    expect(output).toContain("Status for:");
    expect(output).toContain("Total keys: 1");
    expect(output).toContain("FOO: set");
  });

  it("shows MISSING flag for empty required keys", async () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, ".env");
    fs.writeFileSync(envFile, "DB_URL=\n");
    const schemaPath = path.join(dir, "schema.json");
    fs.writeFileSync(
      schemaPath,
      JSON.stringify({ fields: { DB_URL: { required: true, type: "string" } } })
    );
    const result = await getEnvStatus(envFile, dir);
    const output = formatEnvStatus(result);
    expect(output).toContain("MISSING");
  });
});
