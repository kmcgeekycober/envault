import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import {
  loadTokens,
  saveTokens,
  addToken,
  removeToken,
  getToken,
  isTokenExpired,
  formatTokenList,
  getTokensPath,
} from "./token";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-token-"));
}

describe("token", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  it("returns empty store when file missing", () => {
    const store = loadTokens(dir);
    expect(store.tokens).toHaveLength(0);
  });

  it("saves and loads tokens", () => {
    const store = loadTokens(dir);
    addToken(store, "ci", ["read"]);
    saveTokens(store, dir);
    const loaded = loadTokens(dir);
    expect(loaded.tokens).toHaveLength(1);
    expect(loaded.tokens[0].label).toBe("ci");
  });

  it("addToken generates unique token and id", () => {
    const store = loadTokens(dir);
    const e1 = addToken(store, "a", ["read"]);
    const e2 = addToken(store, "b", ["write"]);
    expect(e1.token).not.toBe(e2.token);
    expect(e1.id).not.toBe(e2.id);
  });

  it("removeToken removes by label", () => {
    const store = loadTokens(dir);
    addToken(store, "deploy", ["read", "write"]);
    const removed = removeToken(store, "deploy");
    expect(removed).toBe(true);
    expect(store.tokens).toHaveLength(0);
  });

  it("removeToken returns false when not found", () => {
    const store = loadTokens(dir);
    expect(removeToken(store, "ghost")).toBe(false);
  });

  it("getToken finds by label", () => {
    const store = loadTokens(dir);
    addToken(store, "mytoken", ["read"]);
    const found = getToken(store, "mytoken");
    expect(found?.label).toBe("mytoken");
  });

  it("isTokenExpired returns true for past date", () => {
    const store = loadTokens(dir);
    const entry = addToken(store, "old", [], "2000-01-01T00:00:00.000Z");
    expect(isTokenExpired(entry)).toBe(true);
  });

  it("isTokenExpired returns false for future date", () => {
    const store = loadTokens(dir);
    const entry = addToken(store, "new", [], "2099-01-01T00:00:00.000Z");
    expect(isTokenExpired(entry)).toBe(false);
  });

  it("formatTokenList shows no tokens message", () => {
    const store = loadTokens(dir);
    expect(formatTokenList(store)).toBe("No tokens found.");
  });

  it("formatTokenList includes label and scopes", () => {
    const store = loadTokens(dir);
    addToken(store, "ci", ["read", "sync"]);
    const out = formatTokenList(store);
    expect(out).toContain("ci");
    expect(out).toContain("read,sync");
  });
});
