import fs from "fs";
import os from "os";
import path from "path";
import {
  getCachePath,
  loadCache,
  setCache,
  getCache,
  deleteCache,
  clearCache,
  pruneExpiredCache,
} from "./cache";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-cache-"));
}

describe("cache", () => {
  it("getCachePath returns correct path", () => {
    expect(getCachePath("/project")).toBe("/project/.envault/cache.json");
  });

  it("loadCache returns empty store when file missing", () => {
    const dir = makeTmpDir();
    expect(loadCache(dir)).toEqual({ entries: {} });
  });

  it("setCache and getCache round-trip", () => {
    const dir = makeTmpDir();
    setCache(dir, "MY_KEY", "my_value");
    const entry = getCache(dir, "MY_KEY");
    expect(entry).not.toBeNull();
    expect(entry!.value).toBe("my_value");
    expect(entry!.expiresAt).toBeNull();
  });

  it("getCache returns null for missing key", () => {
    const dir = makeTmpDir();
    expect(getCache(dir, "MISSING")).toBeNull();
  });

  it("getCache returns null for expired entry", () => {
    const dir = makeTmpDir();
    setCache(dir, "TEMP", "value", -1);
    expect(getCache(dir, "TEMP")).toBeNull();
  });

  it("setCache with ttl sets expiresAt", () => {
    const dir = makeTmpDir();
    const entry = setCache(dir, "TTL_KEY", "val", 3600);
    expect(entry.expiresAt).not.toBeNull();
    const expires = new Date(entry.expiresAt!);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });

  it("deleteCache removes an entry", () => {
    const dir = makeTmpDir();
    setCache(dir, "DEL", "bye");
    expect(deleteCache(dir, "DEL")).toBe(true);
    expect(getCache(dir, "DEL")).toBeNull();
  });

  it("deleteCache returns false for missing key", () => {
    const dir = makeTmpDir();
    expect(deleteCache(dir, "NOPE")).toBe(false);
  });

  it("clearCache removes all entries", () => {
    const dir = makeTmpDir();
    setCache(dir, "A", "1");
    setCache(dir, "B", "2");
    const count = clearCache(dir);
    expect(count).toBe(2);
    expect(loadCache(dir).entries).toEqual({});
  });

  it("pruneExpiredCache removes only expired entries", () => {
    const dir = makeTmpDir();
    setCache(dir, "VALID", "keep", 3600);
    setCache(dir, "EXPIRED", "gone", -1);
    const pruned = pruneExpiredCache(dir);
    expect(pruned).toBe(1);
    expect(getCache(dir, "VALID")).not.toBeNull();
  });
});
