import { Command } from "commander";
import {
  setTtl,
  removeTtl,
  loadTtlConfig,
  getExpiredEntries,
  formatTtlEntry,
} from "./ttl";

export function registerTtlCommands(program: Command): void {
  const ttl = program.command("ttl").description("Manage key TTL (expiry) rules");

  ttl
    .command("set <key> <seconds>")
    .description("Set a TTL for a key in the env file")
    .option("-f, --file <file>", "env file", ".env")
    .action((key: string, seconds: string, opts: { file: string }) => {
      const secs = parseInt(seconds, 10);
      if (isNaN(secs) || secs <= 0) {
        console.error("seconds must be a positive integer");
        process.exit(1);
      }
      const entry = setTtl(process.cwd(), opts.file, key, secs);
      console.log(`TTL set: ${formatTtlEntry(entry)}`);
    });

  ttl
    .command("remove <key>")
    .description("Remove TTL for a key")
    .option("-f, --file <file>", "env file", ".env")
    .action((key: string, opts: { file: string }) => {
      const removed = removeTtl(process.cwd(), opts.file, key);
      if (removed) {
        console.log(`TTL removed for key: ${key}`);
      } else {
        console.log(`No TTL found for key: ${key}`);
      }
    });

  ttl
    .command("list")
    .description("List all TTL entries")
    .action(() => {
      const config = loadTtlConfig(process.cwd());
      if (config.entries.length === 0) {
        console.log("No TTL entries configured.");
        return;
      }
      config.entries.forEach((e) => console.log(formatTtlEntry(e)));
    });

  ttl
    .command("expired")
    .description("Show expired keys")
    .action(() => {
      const expired = getExpiredEntries(process.cwd());
      if (expired.length === 0) {
        console.log("No expired keys.");
        return;
      }
      expired.forEach((e) => console.log(formatTtlEntry(e)));
    });
}
