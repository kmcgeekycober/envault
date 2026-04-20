import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getTtlPath,
  loadTtlConfig,
  setTtl,
  removeTtl,
  getExpiredEntries,
  formatTtlEntry,
} from "./ttl";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-ttl-"));
}

describe("ttl", () => {
  let dir: string;
  beforeEach(() => {
    dir = makeTmpDir();
  });

  it("returns empty config when no file exists", () => {
    expect(loadTtlConfig(dir)).toEqual({ entries: [] });
  });

  it("setTtl adds an entry", () => {
    const entry = setTtl(dir, ".env", "SECRET_KEY", 60);
    expect(entry.key).toBe("SECRET_KEY");
    expect(entry.file).toBe(".env");
    expect(entry.expiresAt).toBeGreaterThan(Date.now());
    const config = loadTtlConfig(dir);
    expect(config.entries).toHaveLength(1);
  });

  it("setTtl replaces existing entry for same key+file", () => {
    setTtl(dir, ".env", "SECRET_KEY", 60);
    setTtl(dir, ".env", "SECRET_KEY", 120);
    const config = loadTtlConfig(dir);
    expect(config.entries).toHaveLength(1);
    expect(config.entries[0].expiresAt).toBeGreaterThan(Date.now() + 100000);
  });

  it("removeTtl removes entry and returns true", () => {
    setTtl(dir, ".env", "SECRET_KEY", 60);
    const removed = removeTtl(dir, ".env", "SECRET_KEY");
    expect(removed).toBe(true);
    expect(loadTtlConfig(dir).entries).toHaveLength(0);
  });

  it("removeTtl returns false when entry not found", () => {
    expect(removeTtl(dir, ".env", "MISSING")).toBe(false);
  });

  it("getExpiredEntries returns only expired entries", () => {
    const config = {
      entries: [
        { key: "OLD", file: ".env", expiresAt: Date.now() - 1000 },
        { key: "NEW", file: ".env", expiresAt: Date.now() + 100000 },
      ],
    };
    const p = getTtlPath(dir);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(config));
    const expired = getExpiredEntries(dir);
    expect(expired).toHaveLength(1);
    expect(expired[0].key).toBe("OLD");
  });

  it("formatTtlEntry shows EXPIRED for past entries", () => {
    const entry = { key: "K", file: ".env", expiresAt: Date.now() - 5000 };
    expect(formatTtlEntry(entry)).toContain("EXPIRED");
  });

  it("formatTtlEntry shows remaining seconds", () => {
    const entry = { key: "K", file: ".env", expiresAt: Date.now() + 30000 };
    expect(formatTtlEntry(entry)).toMatch(/expires in \d+s/);
  });
});
