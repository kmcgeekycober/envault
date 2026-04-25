import { Command } from "commander";
import { renameEnvKeyInFile, formatRenameResult } from "./envRename";

export function registerEnvRenameCommands(program: Command): void {
  const rename = program
    .command("rename")
    .description("Rename a key in a .env file");

  rename
    .command("key <oldKey> <newKey>")
    .description("Rename an environment variable key")
    .option("-f, --file <path>", "Path to .env file", ".env")
    .option("--dry-run", "Preview the rename without writing changes")
    .action((oldKey: string, newKey: string, opts: { file: string; dryRun?: boolean }) => {
      if (opts.dryRun) {
        const fs = require("fs");
        if (!fs.existsSync(opts.file)) {
          console.error(`File not found: ${opts.file}`);
          process.exit(1);
        }
        const content = fs.readFileSync(opts.file, "utf-8");
        const hasKey = content.split("\n").some((line: string) => {
          const eq = line.indexOf("=");
          return eq !== -1 && line.slice(0, eq).trim() === oldKey;
        });
        if (!hasKey) {
          console.log(`[dry-run] Key "${oldKey}" not found in ${opts.file}`);
        } else {
          console.log(`[dry-run] Would rename "${oldKey}" → "${newKey}" in ${opts.file}`);
        }
        return;
      }
      const result = renameEnvKeyInFile(opts.file, oldKey, newKey);
      console.log(formatRenameResult(result));
      if (!result.success) process.exit(1);
    });
}
