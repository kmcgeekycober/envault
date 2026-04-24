import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface TokenEntry {
  id: string;
  label: string;
  token: string;
  createdAt: string;
  expiresAt?: string;
  scopes: string[];
}

export interface TokenStore {
  tokens: TokenEntry[];
}

export function getTokensPath(dir: string = process.cwd()): string {
  return path.join(dir, ".envault", "tokens.json");
}

export function loadTokens(dir?: string): TokenStore {
  const p = getTokensPath(dir);
  if (!fs.existsSync(p)) return { tokens: [] };
  return JSON.parse(fs.readFileSync(p, "utf-8")) as TokenStore;
}

export function saveTokens(store: TokenStore, dir?: string): void {
  const p = getTokensPath(dir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2), "utf-8");
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function addToken(
  store: TokenStore,
  label: string,
  scopes: string[],
  expiresAt?: string
): TokenEntry {
  const entry: TokenEntry = {
    id: crypto.randomUUID(),
    label,
    token: generateToken(),
    createdAt: new Date().toISOString(),
    expiresAt,
    scopes,
  };
  store.tokens.push(entry);
  return entry;
}

export function removeToken(store: TokenStore, id: string): boolean {
  const before = store.tokens.length;
  store.tokens = store.tokens.filter((t) => t.id !== id && t.label !== id);
  return store.tokens.length < before;
}

export function getToken(store: TokenStore, id: string): TokenEntry | undefined {
  return store.tokens.find((t) => t.id === id || t.label === id);
}

export function isTokenExpired(entry: TokenEntry): boolean {
  if (!entry.expiresAt) return false;
  return new Date(entry.expiresAt) < new Date();
}

export function formatTokenList(store: TokenStore): string {
  if (store.tokens.length === 0) return "No tokens found.";
  return store.tokens
    .map((t) => {
      const expired = isTokenExpired(t) ? " [EXPIRED]" : "";
      const exp = t.expiresAt ? ` expires=${t.expiresAt}` : "";
      return `[${t.id}] ${t.label}${expired}\n  scopes=${t.scopes.join(",")}${exp}\n  created=${t.createdAt}`;
    })
    .join("\n");
}
