import { Command } from "commander";
import {
  loadTokens,
  saveTokens,
  addToken,
  removeToken,
  getToken,
  isTokenExpired,
  formatTokenList,
} from "./token";

export function registerTokenCommands(program: Command): void {
  const token = program.command("token").description("Manage API tokens for envault");

  token
    .command("create <label>")
    .description("Create a new token")
    .option("--scopes <scopes>", "Comma-separated scopes", "read")
    .option("--expires <date>", "Expiry date (ISO 8601)")
    .action((label: string, opts: { scopes: string; expires?: string }) => {
      const store = loadTokens();
      const scopes = opts.scopes.split(",").map((s) => s.trim());
      const entry = addToken(store, label, scopes, opts.expires);
      saveTokens(store);
      console.log(`Token created: ${entry.token}`);
      console.log(`  id=${entry.id} label=${entry.label} scopes=${scopes.join(",")}`);
      if (entry.expiresAt) console.log(`  expires=${entry.expiresAt}`);
    });

  token
    .command("list")
    .description("List all tokens")
    .action(() => {
      const store = loadTokens();
      console.log(formatTokenList(store));
    });

  token
    .command("show <idOrLabel>")
    .description("Show details of a token")
    .action((idOrLabel: string) => {
      const store = loadTokens();
      const entry = getToken(store, idOrLabel);
      if (!entry) {
        console.error(`Token not found: ${idOrLabel}`);
        process.exit(1);
      }
      const expired = isTokenExpired(entry) ? " [EXPIRED]" : "";
      console.log(`id: ${entry.id}`);
      console.log(`label: ${entry.label}${expired}`);
      console.log(`token: ${entry.token}`);
      console.log(`scopes: ${entry.scopes.join(", ")}`);
      console.log(`created: ${entry.createdAt}`);
      if (entry.expiresAt) console.log(`expires: ${entry.expiresAt}`);
    });

  token
    .command("revoke <idOrLabel>")
    .description("Revoke a token by id or label")
    .action((idOrLabel: string) => {
      const store = loadTokens();
      const removed = removeToken(store, idOrLabel);
      if (!removed) {
        console.error(`Token not found: ${idOrLabel}`);
        process.exit(1);
      }
      saveTokens(store);
      console.log(`Token revoked: ${idOrLabel}`);
    });
}
