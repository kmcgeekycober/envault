import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { flattenEnvFile, formatFlattenResult } from "./envFlatten";

export function registerEnvFlattenCommands(program: Command): void {
  const flat = program
    .command("flatten")
    .description("Flatten env file keys to a normalized format")
    .argument("<file>", "Path to the .env file")
    .option("-p, --prefix <prefix>", "Prefix to prepend to all keys")
    .option("-s, --separator <sep>", "Separator character", "_")
    .option("--no-uppercase", "Preserve original casing")
    .option("-o, --output <file>", "Write flattened output to a file")
    .option("--dry-run", "Preview changes without writing")
    .action((file: string, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const result = flattenEnvFile(file, {
        prefix: opts.prefix,
        separator: opts.separator,
        uppercase: opts.uppercase,
      });

      const serialized = Object.entries(result.flattened)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

      if (opts.dryRun) {
        console.log("# Dry run — no files written");
        console.log(serialized);
        return;
      }

      const outPath = opts.output ?? file;
      fs.writeFileSync(outPath, serialized + "\n", "utf-8");
      console.log(formatFlattenResult(result));
      if (opts.output) {
        console.log(`Written to ${opts.output}`);
      }
    });
}
