import { Command } from "commander";
import {
  getCache,
  setCache,
  deleteCache,
  clearCache,
  pruneExpiredCache,
  loadCache,
} from "./cache";

export function registerCacheCommands(program: Command): void {
  const cache = program.command("cache").description("Manage the env key cache");

  cache
    .command("get <key>")
    .description("Get a cached value by key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const entry = getCache(opts.dir, key);
      if (!entry) {
        console.log(`Cache miss: ${key}`);
        process.exit(1);
      }
      console.log(entry.value);
    });

  cache
    .command("set <key> <value>")
    .description("Set a cached value")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .option("-t, --ttl <seconds>", "TTL in seconds")
    .action((key: string, value: string, opts: { dir: string; ttl?: string }) => {
      const ttl = opts.ttl ? parseInt(opts.ttl, 10) : undefined;
      const entry = setCache(opts.dir, key, value, ttl);
      console.log(`Cached: ${key} (expires: ${entry.expiresAt ?? "never"})`);
    });

  cache
    .command("delete <key>")
    .description("Delete a cached key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((key: string, opts: { dir: string }) => {
      const removed = deleteCache(opts.dir, key);
      console.log(removed ? `Deleted: ${key}` : `Key not found: ${key}`);
    });

  cache
    .command("clear")
    .description("Clear all cached entries")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((opts: { dir: string }) => {
      const count = clearCache(opts.dir);
      console.log(`Cleared ${count} cache entries.`);
    });

  cache
    .command("prune")
    .description("Remove expired cache entries")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((opts: { dir: string }) => {
      const count = pruneExpiredCache(opts.dir);
      console.log(`Pruned ${count} expired entries.`);
    });

  cache
    .command("list")
    .description("List all cached keys")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action((opts: { dir: string }) => {
      const store = loadCache(opts.dir);
      const keys = Object.keys(store.entries);
      if (keys.length === 0) {
        console.log("No cached entries.");
        return;
      }
      for (const key of keys) {
        const e = store.entries[key];
        console.log(`${key} (expires: ${e.expiresAt ?? "never"})`);
      }
    });
}
